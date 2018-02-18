use ws;
use serde_json;

pub const PROTOCOL: &'static str = "thirteen-game";
pub const GAME_SIZE: usize = 2;

use game;
use std::sync::atomic::{AtomicBool, AtomicUsize, Ordering};
use std::sync::{Arc, RwLock, Weak};
use std::collections::{HashMap, VecDeque};

pub fn start_server() {
	println!("Starting server...");

	fn mm_instance(server: &Arc<Server>, game_size: usize) -> Weak<Instance> {
		if let Some(instance) = server
			.mm_instances
			.read()
			.unwrap()
			.iter()
			.find(|i| i.game_size == game_size)
		{
			return Arc::downgrade(instance);
		}

		let instance = Instance::new_arc(Arc::downgrade(&server), GAME_SIZE);
		let weak = Arc::downgrade(&instance);
		server.add_instance(instance);
		weak
	}

	let server = Arc::new(Server::new());

	let mut counter = 0;

	ws::listen("127.0.0.1:2794", |out| {
		let client = ClientConnection {
			client_id: counter,
			instance: mm_instance(&server, GAME_SIZE),
			out: out.into(),
		};
		counter += 1;
		client
	}).unwrap();
}

pub struct Server {
	counter: AtomicUsize,

	// matchmaking instances
	mm_instances: RwLock<VecDeque<Arc<Instance>>>,

	// running instances
	rn_instances: RwLock<HashMap<usize, Arc<Instance>>>,
}

impl Server {
	pub fn new() -> Self {
		Server {
			counter: AtomicUsize::new(0),
			mm_instances: VecDeque::new().into(),
			rn_instances: HashMap::new().into(),
		}
	}

	/// Add an instance.
	pub fn add_instance(&self, instance: Arc<Instance>) {
		self.mm_instances.write().unwrap().push_back(instance);
	}

	/// Upgrade a matchmaking instance into a running instance.
	pub fn upgrade_instance(&self, id: usize) {
		let instance = self.remove_mm_instance(id);
		self.rn_instances.write().unwrap().insert(id, instance);
	}

	/// Remove a running instance.
	pub fn remove_rn_instance(&self, id: usize) -> Arc<Instance> {
		self.rn_instances.write().unwrap().remove(&id).unwrap() // i want an error if evoked wrongly
	}

	/// Remove a matchmaking instance.
	pub fn remove_mm_instance(&self, id: usize) -> Arc<Instance> {
		let mut mm_instances = self.mm_instances.write().unwrap();
		let index = mm_instances
			.iter()
			.map(|i| i.id)
			.position(|i| i == id)
			.unwrap();
		mm_instances.remove(index).unwrap()
	}
}

pub struct Instance {
	id: usize,
	game_size: usize,
	running: AtomicBool,
	server: Weak<Server>,
	local_ids: RwLock<Vec<usize>>,
	senders: RwLock<Vec<Weak<ws::Sender>>>,
	model: RwLock<game::Game>,
}

impl Drop for Instance {
	fn drop(&mut self) {
		println!("Instance #{} is getting dropped", self.id)
	}
}

impl Instance {
	pub fn new_arc(server: Weak<Server>, game_size: usize) -> Arc<Self> {
		let strong = server.upgrade().unwrap();
		let id = strong.counter.load(Ordering::Relaxed);
		let arc = Instance {
			id,
			game_size,
			running: false.into(),
			server: server,
			local_ids: Vec::with_capacity(game_size).into(),
			senders: Vec::with_capacity(game_size).into(),
			model: game::Game::new().into(),
		}.into();
		strong.counter.store(id + 1, Ordering::Relaxed);
		arc
	}

	pub fn running(&self) -> bool {
		self.running.load(Ordering::Relaxed)
	}

	pub fn start(&self) {
		println!("Instance {} is starting.", self.id);

		self.server.upgrade().unwrap().upgrade_instance(self.id);
		self.running.store(true, Ordering::Relaxed);

		let mut game = self.model.write().unwrap();
		game.start();

		let player_count = game.players().len();
		for local_id in 0..player_count {
			let mut cards: Vec<Vec<u8>> = Vec::with_capacity(player_count);

			let mut i = 0;
			while i < player_count {
				use cards::Card;
				cards.push(
					game.player_handle((i + local_id) % player_count)
						.cards()
						.iter()
						.map(Card::into_id)
						.collect(),
				);
				i += 1;
			}

			self.send_out(local_id, &DataOut::Start { cards: cards });

			self.send_out(
				game.current_turn(),
				&DataOut::YourTurn {
					first_turn: true,
					must_play: true,
				},
			);
		}
	}

	pub fn process(&self, local_id: usize, data: DataIn) {
		match data {
			DataIn::Pass {} => {
				use game::PassError;
				let mut game = self.model.write().unwrap();
				match game.player_handle(local_id).try_pass() {
					Ok(()) => {
						self.send_out(local_id, &DataOut::PassSuccess {});

						if game.is_new_pattern() {
							self.broadcast(&DataOut::Discard { ids: Vec::new() });
							self.send_out(
								game.current_turn(),
								&DataOut::YourTurn {
									first_turn: false,
									must_play: true,
								},
							);
						} else {
							self.send_out(
								game.current_turn(),
								&DataOut::YourTurn {
									first_turn: false,
									must_play: false,
								},
							);
						}
					}
					Err(error) => {
						self.send_out(
							local_id,
							&DataOut::Error {
								reason: match error {
									PassError::OutOfTurn => String::from("It is not your turn."),
									PassError::MustPlay => {
										String::from("You must play a new pattern!")
									}
									PassError::MustPlayLowest => String::from(
										"You must play your lowest card for the first turn.",
									),
								},
							},
						);
					}
				}
			}
			DataIn::Play { ids } => {
				use cards::Card;
				use game::PlayError;
				let mut game = self.model.write().unwrap();

				let mut cards = Vec::with_capacity(ids.len());
				for id in &ids {
					if let Some(card) = Card::from_id(*id) {
						cards.push(card);
					} else {
						self.send_out(
							local_id,
							&DataOut::Error {
								reason: String::from("Invalid card IDs."),
							},
						);
					}
				}

				match game.player_handle(local_id).try_play(&cards) {
					Ok(win) => {
						self.send_out(local_id, &DataOut::PlaySuccess {});
						self.broadcast(&DataOut::Discard {
							ids: cards.iter().map(Card::into_id).collect(),
						});
						if win {
							for i in 0..self.connected_count() {
								self.send_out(
									i,
									&DataOut::GameEnd {
										victory: i == local_id,
									},
								);
							}
						} else {
							self.send_out(
								game.current_turn(),
								&DataOut::YourTurn {
									first_turn: false,
									must_play: false,
								},
							);
						}
					}
					Err(error) => {
						self.send_out(
							local_id,
							&DataOut::Error {
								reason: match error {
									PlayError::OutOfTurn => {
										String::from("It is not your turn! Wait a bit!")
									}
									PlayError::NoCards => {
										String::from("You can't play nothing!")
									}
									PlayError::MustPlayLowest => String::from(
										"You must play your lowest card for the first turn.",
									),
									PlayError::ForgedCards => {
										String::from("Are you trying to cheat?")
									}
									PlayError::BadPlay => String::from(
										"You can not play those cards on this pattern!",
									),
								},
							},
						);
					}
				}
			}
		}
		// unimplemented!()
	}

	pub fn send_out(&self, local_id: usize, data: &DataOut) {
		let sender = &self.senders.read().unwrap()[local_id].upgrade().unwrap();

		sender.send(serde_json::to_string(data).unwrap()).unwrap();
	}

	pub fn broadcast(&self, data: &DataOut) {
		for i in 0..self.connected_count() {
			self.send_out(i, data);
		}
	}

	#[inline]
	pub fn broadcast_queue_update(&self) {
		let data = DataOut::QueueUpdate {
			size: self.senders.read().unwrap().len(),
			goal: self.game_size,
		};
		self.broadcast(&data);
	}

	#[inline]
	pub fn connected_count(&self) -> usize {
		self.senders.read().unwrap().len()
	}

	pub fn add_client(&self, client_id: usize, sender: Weak<ws::Sender>) -> Result<(), ws::Error> {
		if self.running() {
			return Err(ws::Error::new(
				ws::ErrorKind::Capacity,
				"Attempted to connect to full game",
			));
		}

		self.senders.write().unwrap().push(sender);
		self.local_ids.write().unwrap().push(client_id);
		self.model.write().unwrap().add_player();

		self.broadcast_queue_update();

		if self.connected_count() >= self.game_size {
			self.start();
		}

		Ok(())
	}

	pub fn remove_client(&self, client_id: usize, close: bool) {
		if let Some(local_id) = self.local_id(client_id) {
			let sender = self.senders.write().unwrap().remove(local_id);
			if close {
				sender.upgrade().map(|s| s.close(ws::CloseCode::Normal));
			}
			self.local_ids.write().unwrap().remove(local_id);
		}

		if self.connected_count() <= 1 {
			self.close();
			if self.running() {
				self.server.upgrade().unwrap().remove_rn_instance(self.id);
			} else {
				self.server.upgrade().unwrap().remove_mm_instance(self.id);
			}
		} else {
			self.broadcast_queue_update();
		}
	}

	pub fn close(&self) {
		let mut senders = self.senders.write().unwrap();
		senders
			.iter()
			.map(|w| w.upgrade().unwrap())
			.for_each(|s| s.close(ws::CloseCode::Normal).unwrap());
		senders.clear();
		self.local_ids.write().unwrap().clear();
	}

	pub fn local_id(&self, client_id: usize) -> Option<usize> {
		self.local_ids
			.read()
			.unwrap()
			.iter()
			.position(|&x| x == client_id)
	}
}

#[derive(Serialize, Deserialize, Debug)]
pub enum DataOut {
	QueueUpdate { size: usize, goal: usize },
	Start { cards: Vec<Vec<u8>> },
	Discard { ids: Vec<u8> },

	GameEnd { victory: bool },
	PlaySuccess {},
	PassSuccess {},

	YourTurn { first_turn: bool, must_play: bool },
	EndTurn {},

	Status { message: String },
	Error { reason: String },
}

#[derive(Serialize, Deserialize, Debug)]
pub enum DataIn {
	Pass {},
	Play { ids: Vec<u8> },
}

struct ClientConnection {
	client_id: usize,
	instance: Weak<Instance>,

	// output to client
	out: Arc<ws::Sender>,
}

impl ws::Handler for ClientConnection {
	fn on_message(&mut self, msg: ws::Message) -> ws::Result<()> {
		// not ready
		if !self.instance.upgrade().unwrap().running() {
			return Ok(());
		}

		match msg {
			ws::Message::Text(buf) => match serde_json::from_str::<DataIn>(&buf) {
				Ok(data) => {
					let instance = self.instance.upgrade().unwrap();
					instance.process(instance.local_id(self.client_id).unwrap(), data);
					Ok(())
				}
				Err(_) => Err(ws::Error::new(
					ws::ErrorKind::Protocol,
					"Unparsable data sent",
				)),
			},
			ws::Message::Binary(_) => Err(ws::Error::new(
				ws::ErrorKind::Protocol,
				"Binary not accepted",
			)),
		}
	}

	fn on_close(&mut self, code: ws::CloseCode, reason: &str) {
		self.instance
			.upgrade()
			.map(|game| game.remove_client(self.client_id, false));

		match code {
			ws::CloseCode::Normal => println!("The client is done with the connection."),
			ws::CloseCode::Away => println!("The client is leaving the site."),
			_ => println!("The client encountered an error: {}", reason),
		}
	}

	fn on_open(&mut self, _: ws::Handshake) -> ws::Result<()> {
		self.instance
			.upgrade()
			.unwrap()
			.add_client(self.client_id, Arc::downgrade(&self.out))?;

		Ok(())
	}

	fn on_request(&mut self, req: &ws::Request) -> ws::Result<ws::Response> {
		let mut response = ws::Response::from_request(req)?;
		response.set_protocol(PROTOCOL);
		Ok(response)
	}
}

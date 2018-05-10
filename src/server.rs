use serde_json;
use ws;

pub const PROTOCOL: &'static str = "thirteen-game";

use game;
use linked_hash_map::LinkedHashMap;
use std::{
	collections::{HashMap, VecDeque},
	sync::{
		atomic::{AtomicBool, AtomicUsize, Ordering}, {Arc, RwLock, Weak},
	},
};

pub fn start_server() {
	println!("Starting server.");

	let server = Arc::new(Server::new());

	let mut counter = 0;

	ws::listen("127.0.0.1:2794", |out| {
		let client = ClientConnection {
			client_id: counter,
			server: Arc::downgrade(&server),
			instance: None,
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

	pub fn find_instance(server: &Arc<Server>, mut game_size: usize) -> Weak<Instance> {
		if let Some(instance) = server
			.mm_instances
			.read()
			.unwrap()
			.iter()
			.find(|i| i.game_size == game_size)
		{
			return Arc::downgrade(instance);
		}

		if game_size > 4 {
			game_size = 4;
		} else if game_size < 2 {
			game_size = 2;
		}

		let instance = Instance::new_arc(Arc::downgrade(&server), game_size);
		let weak = Arc::downgrade(&instance);
		server.add_instance(instance);
		weak
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
	senders: RwLock<LinkedHashMap<usize, Weak<ws::Sender>>>,
	model: RwLock<game::Game>,
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
			senders: LinkedHashMap::with_capacity(game_size).into(),
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

		let players: Vec<PlayerData> = game.players()
			.iter()
			.map(|p| PlayerData {
				id: p.id,
				name: p.name.clone(),
			})
			.collect();

		for p in &players {
			use cards::Card;
			self.send_out(
				p.id,
				&DataOut::READY {
					your_cards: game.player_handle(p.id)
						.cards()
						.iter()
						.map(Card::into_id)
						.collect(),
					players: players.clone(),
					cards_per_player: 13,
				},
			);
		}

		self.broadcast(&DataOut::TURN_CHANGE {
			player_id: game.current_player().id,
			first_turn: true,
			new_pattern: true,
		});
	}

	pub fn process(&self, client_id: usize, data: DataIn) {
		match data {
			DataIn::QUEUE { .. } => { /* ignore */ }
			DataIn::PASS {} => {
				use game::PassError;
				let mut game = self.model.write().unwrap();
				match game.player_handle(client_id).try_pass() {
					Ok(()) => {
						self.send_out(
							client_id,
							&DataOut::SUCCESS {
								message: SuccessCode::PASS,
							},
						);

						self.broadcast(&DataOut::TURN_CHANGE {
							player_id: game.current_player().id,
							first_turn: false,
							new_pattern: game.is_new_pattern(),
						});
					}
					Err(error) => {
						self.send_out(
							client_id,
							&DataOut::ERROR {
								message: match error {
									PassError::OutOfTurn => ErrorCode::OUT_OF_TURN,
									PassError::MustPlay => ErrorCode::MUST_START_NEW_PATTERN,
									PassError::MustPlayLowest => ErrorCode::MUST_PLAY_LOWEST,
								},
							},
						);
					}
				}
			}
			DataIn::PLAY { card_ids } => {
				use cards::Card;
				use game::PlayError;
				let mut game = self.model.write().unwrap();

				let mut cards = Vec::with_capacity(card_ids.len());
				for id in &card_ids {
					if let Some(card) = Card::from_id(*id) {
						cards.push(card);
					} else {
						self.send_out(
							client_id,
							&DataOut::ERROR {
								message: ErrorCode::INVALID_CARD,
							},
						);
					}
				}

				match game.player_handle(client_id).try_play(&cards) {
					Ok(win) => {
						self.send_out(
							client_id,
							&DataOut::SUCCESS {
								message: SuccessCode::PLAY,
							},
						);
						self.broadcast(&DataOut::PLAY {
							player_id: client_id,
							card_ids: cards.iter().map(Card::into_id).collect(),
						});
						if win {
							self.broadcast(&DataOut::END {
								victor_id: client_id,
							});
						} else {
							self.broadcast(&DataOut::TURN_CHANGE {
								player_id: game.current_player().id,
								first_turn: false,
								new_pattern: false,
							});
						}
					}
					Err(error) => {
						self.send_out(
							client_id,
							&DataOut::ERROR {
								message: match error {
									PlayError::OutOfTurn => ErrorCode::OUT_OF_TURN,
									PlayError::NoCards => ErrorCode::NO_CARDS,
									PlayError::MustPlayLowest => ErrorCode::MUST_PLAY_LOWEST,
									PlayError::InvalidCard => ErrorCode::INVALID_CARD,
									PlayError::InvalidPattern => ErrorCode::INVALID_PATTERN,
									PlayError::BadPattern => ErrorCode::BAD_PATTERN,
									PlayError::BadCard => ErrorCode::BAD_CARD,
								},
							},
						);
					}
				}
			}
		}
	}

	pub fn send_out(&self, client_index: usize, data: &DataOut) {
		let sender = &self.senders.read().unwrap()[&client_index]
			.upgrade()
			.expect("Reference dropped");

		sender
			.send(serde_json::to_string(data).expect("Can not serialize"))
			.expect("Error while sending");
	}

	pub fn broadcast(&self, data: &DataOut) {
		let data = serde_json::to_string(data).expect("Can not serialize");
		let data = data.as_str();
		self.senders
			.read()
			.unwrap()
			.values()
			.map(|w| w.upgrade().unwrap())
			.for_each(|sender| sender.send(data).expect("Error while sending"));
	}

	#[inline]
	pub fn broadcast_queue_update(&self) {
		let data = DataOut::QUEUE_UPDATE {
			size: self.senders.read().unwrap().len(),
			goal: self.game_size,
		};
		self.broadcast(&data);
	}

	#[inline]
	pub fn connected_count(&self) -> usize {
		self.senders.read().unwrap().len()
	}

	pub fn add_client(
		&self,
		sender: Weak<ws::Sender>,
		client_id: usize,
		name: String,
	) -> Result<(), ws::Error> {
		if self.running() {
			return Err(ws::Error::new(
				ws::ErrorKind::Capacity,
				"Attempted to connect to full game",
			));
		}

		self.senders.write().unwrap().insert(client_id, sender);
		self.model.write().unwrap().add_player(client_id, name);

		self.broadcast_queue_update();

		if self.connected_count() >= self.game_size {
			self.start();
		}

		Ok(())
	}

	pub fn remove_client(&self, client_id: usize, close: bool) {
		let removed = self.senders.write().unwrap().remove(&client_id); // take them and drop them
		if let Some(sender) = removed {
			if close {
				sender.upgrade().map(|s| s.close(ws::CloseCode::Normal));
			}
			self.model.write().unwrap().remove_player(client_id);
		}

		if self.connected_count() == 0 {
			if self.running() {
				self.close();
				self.server.upgrade().unwrap().remove_rn_instance(self.id);
			}
		} else if self.connected_count() == 1 && self.running() {
			self.close();
			self.server.upgrade().unwrap().remove_rn_instance(self.id);
		} else if self.running() {
			self.broadcast_queue_update();
		}
	}

	pub fn close(&self) {
		let mut senders = self.senders.write().unwrap();
		senders
			.values()
			.map(|w| w.upgrade().unwrap())
			.for_each(|s| s.close(ws::CloseCode::Normal).unwrap());
		senders.clear();
		println!("Instance {} is closing.", self.id)
	}
}

#[allow(non_camel_case_types)]
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct PlayerData {
	pub id: usize,
	name: String,
}

#[allow(non_camel_case_types)]
#[derive(Serialize, Deserialize, Debug)]
#[serde(tag = "type")]
pub enum DataOut {
	QUEUE_UPDATE {
		size: usize,
		goal: usize,
	},
	IDENTIFY {
		id: usize,
	},
	READY {
		your_cards: Vec<u8>,
		players: Vec<PlayerData>,
		cards_per_player: usize,
	},
	PLAY {
		player_id: usize,
		card_ids: Vec<u8>,
	},
	END {
		victor_id: usize,
	},
	TURN_CHANGE {
		player_id: usize,
		first_turn: bool,
		new_pattern: bool,
	},
	STATUS {
		message: String,
	},
	SUCCESS {
		message: SuccessCode,
	},
	ERROR {
		message: ErrorCode,
	},
}

#[allow(non_camel_case_types)]
#[derive(Serialize, Deserialize, Debug)]
pub enum SuccessCode {
	PASS,
	PLAY,
}

#[allow(non_camel_case_types)]
#[derive(Serialize, Deserialize, Debug)]
pub enum ErrorCode {
	OUT_OF_TURN,
	NO_CARDS,
	MUST_PLAY_LOWEST,
	MUST_START_NEW_PATTERN,
	INVALID_CARD,
	INVALID_PATTERN,
	BAD_CARD,
	BAD_PATTERN,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(tag = "type")]
pub enum DataIn {
	QUEUE { name: String, game_size: usize },
	PASS {},
	PLAY { card_ids: Vec<u8> },
}

struct ClientConnection {
	client_id: usize,

	server: Weak<Server>,
	instance: Option<Weak<Instance>>,

	// output to client
	out: Arc<ws::Sender>,
}

impl ws::Handler for ClientConnection {
	fn on_message(&mut self, msg: ws::Message) -> ws::Result<()> {
		match msg {
			ws::Message::Text(buf) => match serde_json::from_str::<DataIn>(&buf) {
				Ok(DataIn::QUEUE { name, game_size }) => {
					let mm_instance =
						Server::find_instance(&self.server.upgrade().unwrap(), game_size);

					mm_instance.upgrade().unwrap().add_client(
						Arc::downgrade(&self.out),
						self.client_id,
						name,
					)?;

					self.instance = Some(mm_instance);

					Ok(())
				}
				Ok(data) => {
					let instance = match &self.instance {
						None => return Ok(()),
						Some(i) => i.upgrade().unwrap(),
					};

					if !instance.running() {
						return Ok(());
					}

					instance.process(self.client_id, data);
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
		match self.instance {
			None => return,
			Some(ref i) => i.upgrade()
				.map(|game| game.remove_client(self.client_id, false)),
		};

		match code {
			ws::CloseCode::Normal => println!("The client is done with the connection."),
			ws::CloseCode::Away => println!("The client is leaving the site."),
			_ => println!("The client encountered an error: {}", reason),
		}
	}

	fn on_open(&mut self, _: ws::Handshake) -> ws::Result<()> {
		self.out
			.send(serde_json::to_string(&DataOut::IDENTIFY { id: self.client_id }).unwrap())
			.unwrap();

		Ok(())
	}

	fn on_request(&mut self, req: &ws::Request) -> ws::Result<ws::Response> {
		let mut response = ws::Response::from_request(req)?;
		response.set_protocol(PROTOCOL);
		Ok(response)
	}
}

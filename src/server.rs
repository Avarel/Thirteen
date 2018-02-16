use ws;
use serde_json;

pub const PROTOCOL: &'static str = "thirteen-game";
pub const GAME_SIZE: usize = 2;

use game;
use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::{Arc, Weak, RwLock};
use std::collections::{HashMap, VecDeque};

pub fn start_server() {
	println!("Starting server...");

	let server = Arc::new(Server::new());
	// server.add_instance(Instance::new(Arc::downgrade(&server), GAME_SIZE));

	let mut counter = 0;

	ws::listen("127.0.0.1:2794", |out| {
		let client = ClientConnection {
			client_id: counter,
			game: Server::mm_instance(&server, GAME_SIZE),
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

	/// Get the longest-waiting instance (in this case, the front of the queue) with the desired game size.
	/// If theres no queued instances with desired game size, create a new one.
	pub fn mm_instance(this: &Arc<Server>, game_size: usize) -> Weak<Instance> {
		if let Some(instance) = this.mm_instances
			.read()
			.unwrap()
			.iter()
			.find(|i| i.game_size == game_size)
		{
			return Arc::downgrade(instance);
		}

		let instance = Instance::new_arc(Arc::downgrade(this), GAME_SIZE);
		let weak = Arc::downgrade(&instance);
		this.add_instance(instance);
		weak
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
	running: bool,
	id: usize,
	game_size: usize,
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
			running: false,
			game_size,
			server: server,
			local_ids: Vec::with_capacity(game_size).into(),
			senders: Vec::with_capacity(game_size).into(),
			model: game::Game::new().into(),
		}.into();
		strong
			.counter
			.store(id + 1, Ordering::Relaxed);
		arc
	}

	pub fn process(&self, payload: PayloadIn) {
		unimplemented!()
	}

	pub fn broadcast(&self, data: DataOut) {
		println!("Sending out: {:?}", data);
		self.senders
			.read()
			.unwrap()
			.iter()
			.map(|w| w.upgrade().unwrap())
			.for_each(|s| {
				s.send(serde_json::to_string(&data).unwrap()).unwrap();
			});
	}

	#[inline]
	pub fn broadcast_queue_update(&self) {
		let data = DataOut::QueueUpdate {
			size: self.senders.read().unwrap().len(),
			goal: self.game_size,
		};
		self.broadcast(data);
	}

	#[inline]
	pub fn connected_count(&self) -> usize {
		self.senders.read().unwrap().len()
	}

	pub fn send_out(&self, payload: PayloadOut) {
		let sender = &self.senders.read().unwrap()[payload.local_id]
			.upgrade()
			.unwrap();
		sender
			.send(serde_json::to_string(&payload.data).unwrap())
			.unwrap();
	}

	pub fn add_client(&self, id: usize, sender: Weak<ws::Sender>) -> Result<(), ws::Error> {
		if self.connected_count() >= self.game_size {
			return Err(ws::Error::new(
				ws::ErrorKind::Capacity,
				"Attempted to connect to full game",
			));
		}

		self.senders.write().unwrap().push(sender);
		self.local_ids.write().unwrap().push(id);
		self.broadcast_queue_update();

		Ok(())
	}

	pub fn remove_client(&self, id: usize, close: bool) {
		if let Some(local_id) = self.local_id(id) {
			let sender = self.senders.write().unwrap().remove(local_id);
			if close {
				sender.upgrade().map(|s| s.close(ws::CloseCode::Normal));
			}
			self.local_ids.write().unwrap().remove(local_id);
			self.broadcast_queue_update();
		}

		if self.connected_count() == 0 {
			if self.running {
				self.server.upgrade().unwrap().remove_rn_instance(self.id);
			} else {
				self.server.upgrade().unwrap().remove_mm_instance(self.id);
			}
		}
	}

	pub fn local_id(&self, id: usize) -> Option<usize> {
		self.local_ids.read().unwrap().iter().position(|&x| x == id)
	}
}

#[derive(Debug)]
pub struct PayloadOut {
	local_id: usize,
	data: DataOut,
}

#[derive(Serialize, Deserialize, Debug)]
pub enum DataOut {
	QueueUpdate { size: usize, goal: usize },
	InitializeGame { cards: Vec<Vec<u8>> },
	Play { local_id: usize, cards: Vec<u8> },
	Error { reason: String },
}

#[derive(Debug)]
pub struct PayloadIn {
	client_id: usize,
	data: DataIn,
}

#[derive(Serialize, Deserialize, Debug)]
pub enum DataIn {
	Pass {},
	Play { cards: Vec<u8> },
}

struct ClientConnection {
	client_id: usize,
	game: Weak<Instance>,

	// output to client
	out: Arc<ws::Sender>,
}

impl ws::Handler for ClientConnection {
	fn on_message(&mut self, msg: ws::Message) -> ws::Result<()> {
		println!("Incoming: {:?}", msg);

		// not ready
		if !self.game.upgrade().unwrap().running {
			return Ok(());
		}

		match msg {
			ws::Message::Text(buf) => match serde_json::from_str::<DataIn>(&buf) {
				Ok(data) => {
					self.game.upgrade().unwrap().process(PayloadIn {
						client_id: self.client_id,
						data,
					});
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
		self.game
			.upgrade()
			.unwrap()
			.remove_client(self.client_id, false);

		match code {
			ws::CloseCode::Normal => println!("The client is done with the connection."),
			ws::CloseCode::Away => println!("The client is leaving the site."),
			_ => println!("The client encountered an error: {}", reason),
		}
	}

	fn on_open(&mut self, _: ws::Handshake) -> ws::Result<()> {
		self.game
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

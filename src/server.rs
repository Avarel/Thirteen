use ws;
use serde_json;

pub const PROTOCOL: &'static str = "thirteen-game";

// struct Server {
// 	out: Sender,
// }

// impl Handler for Server {
// 	fn on_message(&mut self, msg: Message) -> Result<()> {
// 		println!("{:?}", msg);
// 		match msg {
// 			Message::Text(buf) => {
// 				let buf = format!("wow, \"{},\" I think so too!", buf);
// 				self.out.send(Message::Text(buf))
// 			}
// 			_ => self.out.send(msg)
// 		}
// 	}

// 	fn on_close(&mut self, code: CloseCode, reason: &str) {
// 		match code {
// 			CloseCode::Normal => println!("The client is done with the connection."),
// 			CloseCode::Away => println!("The client is leaving the site."),
// 			_ => println!("The client encountered an error: {}", reason),
// 		}
// 	}

//     fn on_request(&mut self, req: &Request) -> Result<Response> {
//         let mut response = Response::from_request(req)?;
// 		response.set_protocol(PROTOCOL);
// 		Ok(response)
//     }
// }

// use std::sync::mpsc::{channel, Sender as SenderChannel, Receiver};

use std::sync;

pub fn start_server() {
	println!("Starting server...");

	let j = serde_json::to_string(&DataIn::Pass {}).unwrap();

	println!("{}", j);

	let event: DataIn = serde_json::from_str(&j).unwrap();

	println!("{:?}", event);

	let mut game = sync::Arc::new(Server {
		ready: false,
		local_ids: Vec::with_capacity(4).into(),
		senders: Vec::with_capacity(4).into(),
	});

	let mut counter = 0;

	ws::listen("127.0.0.1:2794", |out| {
		let client = ClientConnection {
			client_id: counter,
			game: sync::Arc::downgrade(&game),
			out: sync::Arc::new(out),
		};
		counter += 1;
		client
	}).unwrap();
}

pub struct Server {
	// input_channel: sync::Arc<Receiver<PayloadIn>>,
	ready: bool,
	local_ids: sync::RwLock<Vec<usize>>,
	senders: sync::RwLock<Vec<sync::Weak<ws::Sender>>>,
}

impl Server {
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
		};
		self.broadcast(data);
	}

	pub fn send_out(&self, payload: PayloadOut) {
		unimplemented!()
	}

	pub fn add_client(&self, id: usize, sender: sync::Weak<ws::Sender>) {
		self.senders.write().unwrap().push(sender);
		self.local_ids.write().unwrap().push(id);
		self.broadcast_queue_update();
	}

	pub fn remove_client(&self, id: usize, closed_by_server: bool) {
		let local_id = self.local_id(id);
		let sender = self.senders.write().unwrap().remove(local_id);
		if closed_by_server {
			sender.upgrade().map(|s| s.close(ws::CloseCode::Normal));
		}
		self.local_ids.write().unwrap().remove(local_id);
		self.broadcast_queue_update();
	}

	pub fn local_id(&self, id: usize) -> usize {
		self.local_ids
			.read()
			.unwrap()
			.iter()
			.position(|&x| x == id)
			.unwrap()
	}
}

#[derive(Debug)]
pub struct PayloadOut {
	local_id: usize,
	data: DataOut,
}

#[derive(Serialize, Deserialize, Debug)]
pub enum DataOut {
	QueueUpdate { size: usize },
}

#[derive(Debug)]
pub struct PayloadIn {
	client_id: usize,
	data: DataIn,
}

#[derive(Serialize, Deserialize, Debug)]
pub enum DataIn {
	Pass {},
}

struct ClientConnection {
	client_id: usize,
	game: sync::Weak<Server>,

	// output to client
	out: sync::Arc<ws::Sender>,
}

impl ws::Handler for ClientConnection {
	fn on_message(&mut self, msg: ws::Message) -> ws::Result<()> {
		println!("Incoming: {:?}", msg);

		// not ready
		if !self.game.upgrade().unwrap().ready {
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
				Err(_) => Result::Err(ws::Error::new(
					ws::ErrorKind::Protocol,
					"Unparsable data sent",
				)),
			},
			_ => Result::Err(ws::Error::new(
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
			.add_client(self.client_id, sync::Arc::downgrade(&self.out));
		Ok(())
	}

	fn on_request(&mut self, req: &ws::Request) -> ws::Result<ws::Response> {
		let mut response = ws::Response::from_request(req)?;
		response.set_protocol(PROTOCOL);
		Ok(response)
	}
}
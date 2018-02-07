use std::thread;
use websocket::OwnedMessage;
use websocket::sync::Server;

pub const PROTOCOL: &'static str = "thirteen-game";

pub fn start_server() {
	// bind to the server
	let server = Server::bind("127.0.0.1:2794").unwrap();

	for request in server.filter_map(Result::ok) {
		// Spawn a new thread for each connection.
		thread::spawn(move || {
			if !request.protocols().contains(&PROTOCOL.to_string()) {
				request.reject().unwrap();
				return;
			}

			let mut client = request.use_protocol(PROTOCOL).accept().unwrap();

			let ip = client.peer_addr().unwrap();

			println!("Connection from {}", ip);

			let message = OwnedMessage::Text(String::from("Connected to server!"));
			client.send_message(&message).unwrap();

			let (mut receiver, mut sender) = client.split().unwrap();

			for message in receiver.incoming_messages() {
				let message = message.unwrap();

				match message {
					OwnedMessage::Close(_) => {
						let message = OwnedMessage::Close(None);
						sender.send_message(&message).unwrap();
						println!("Client {} disconnected", ip);
						return;
					}
					OwnedMessage::Ping(ping) => {
						let message = OwnedMessage::Pong(ping);
						sender.send_message(&message).unwrap();
					}
					OwnedMessage::Text(s) => {
						let buf = format!("I concur! \"{}\" to you too!", s);
						sender.send_message(&OwnedMessage::Text(buf)).unwrap();
					}
					_ => sender.send_message(&message).unwrap(),
				}
			}
		});
	}
}

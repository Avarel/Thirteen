use ws::{listen, CloseCode, Handler, Message, Result, Sender, Request, Response};

pub const PROTOCOL: &'static str = "thirteen-game";

struct Server {
	out: Sender,
}

impl Handler for Server {
	fn on_message(&mut self, msg: Message) -> Result<()> {
		println!("{:?}", msg);
		match msg {
			Message::Text(buf) => {
				let buf = format!("wow, \"{},\" I think so too!", buf);
				self.out.send(Message::Text(buf))
			}
			_ => self.out.send(msg)
		}
	}

	fn on_close(&mut self, code: CloseCode, reason: &str) {
		match code {
			CloseCode::Normal => println!("The client is done with the connection."),
			CloseCode::Away => println!("The client is leaving the site."),
			_ => println!("The client encountered an error: {}", reason),
		}
	}

    fn on_request(&mut self, req: &Request) -> Result<Response> {
        let mut response = Response::from_request(req)?;
		response.set_protocol(PROTOCOL);
		Ok(response)
    }
}

pub fn start_server() {
	println!("Starting server...");
	listen("127.0.0.1:2794", |out| {
		Server { 
			out
		} 
	}).unwrap()
}

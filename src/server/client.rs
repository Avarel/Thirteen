use super::instance::Instance;
use super::Server;
use data::{Request, Response};
use serde_json;
use std::cell::RefCell;
use std::ops::Deref;
use std::rc::{Rc, Weak};
use uuid::Uuid;
use ws;

pub struct ClientHandler {
    pub id: Uuid,
    pub server: *mut Server,
    pub instance_id: Option<Uuid>,

    pub out: ws::Sender,
}

impl ws::Handler for ClientHandler {
    fn on_message(&mut self, msg: ws::Message) -> ws::Result<()> {
        let server = unsafe { &mut *self.server };
        match msg {
            ws::Message::Text(buf) => match serde_json::from_str::<Request>(&buf) {
                Ok(Request::JOIN_GAME { name, game_size }) => {
                    let instance_id = server.find_or_new_instance(game_size);
                    server
                        .get_instance(instance_id)
                        .unwrap()
                        .add_client(self as *mut ClientHandler, name);
                    self.instance_id = Some(instance_id);
                    debug!("Successfully setted connecting instance.");
                    Ok(())
                }
                Ok(Request::EXIT_GAME) => {
                    self.instance_id.map(|o| {
                        server
                            .get_instance(o)
                            .map(|i| i.remove_client(self.id, false))
                    });
                    self.clear_instance();
                    Ok(())
                }
                Ok(data) => {
                    self.instance_id
                        .map(|o| server.get_instance(o).map(|i| i.process(self.id, data)));
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

    fn on_open(&mut self, _: ws::Handshake) -> ws::Result<()> {
        self.out
            .send(serde_json::to_string(&Response::IDENTIFY { id: self.id }).unwrap())
            .unwrap();
        Ok(())
    }

    fn on_request(&mut self, req: &ws::Request) -> ws::Result<ws::Response> {
        let mut response = ws::Response::from_request(req)?;
        response.set_protocol(super::PROTOCOL);
        Ok(response)
    }

    fn on_close(&mut self, code: ws::CloseCode, reason: &str) {
        let server = unsafe { &mut *self.server };
        self.instance_id.map(|o| {
            server
                .get_instance(o)
                .map(|i| i.remove_client(self.id, false))
        });

        server.remove_client(self.id, false);

        match code {
            ws::CloseCode::Normal => debug!("Client (id: {}) has closed the connection.", self.id),
            ws::CloseCode::Away => debug!("Client (id: {}) is leaving the website.", self.id),
            _ => warn!(
                "Client (id: {}) has encountered an error ({:?}): {}.",
                self.id, code, reason
            ),
        }
    }
}

impl ClientHandler {
    pub fn clear_instance(&mut self) {
        let server = unsafe { &mut *self.server };
        self.instance_id.map(|o| {
            server.get_instance(o).map(|i| {
                debug!(
                    "Client (id: {}) disconnected from instance (id: {}).",
                    self.id, i.id
                )
            })
        });
        self.instance_id = None;
    }

    pub fn send(&self, data: &Response) {
        self.out
            .send(serde_json::to_string(data).expect("Can not serialize"))
            .expect("Error while sending");
    }

    pub fn disconnect(&self) {
        self.out
            .close(ws::CloseCode::Normal)
            .expect("Error when closing connection");
    }
}

impl Drop for ClientHandler {
    fn drop(&mut self) {
        debug!("Dropping client (id: {}).", self.id);
    }
}

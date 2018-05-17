use super::instance::{Instance, SharedInstance};
use super::{Server, SharedServer};
use data::{Request, Response};
use serde_json;
use std::cell::RefCell;
use std::ops::Deref;
use std::rc::{Rc, Weak};
use uuid::Uuid;
use ws;

pub struct ClientHandler {
    pub id: Uuid,
    pub server: Weak<Server>,
    pub instance: RefCell<Option<Weak<Instance>>>,

    pub out: Rc<ws::Sender>,
}

#[derive(Clone)]
pub struct RcClient(pub Rc<ClientHandler>);

impl Deref for RcClient {
    type Target = Rc<ClientHandler>;

    fn deref(&self) -> &Rc<ClientHandler> {
        &self.0
    }
}

impl RcClient {
    pub fn downgrade(this: &RcClient) -> WeakClient {
        WeakClient(Rc::downgrade(this))
    }
}

#[derive(Clone)]
pub struct WeakClient(pub Weak<ClientHandler>);

impl Deref for WeakClient {
    type Target = Weak<ClientHandler>;

    fn deref(&self) -> &Weak<ClientHandler> {
        &self.0
    }
}

impl WeakClient {
    pub fn upgrade(&self) -> Option<RcClient> {
        self.0.upgrade().map(RcClient)
    }
}

impl ws::Handler for RcClient {
    fn on_message(&mut self, msg: ws::Message) -> ws::Result<()> {
        match msg {
            ws::Message::Text(buf) => match serde_json::from_str::<Request>(&buf) {
                Ok(Request::JOIN_GAME { name, game_size }) => {
                    let instance = self.server.find_or_new_instance(game_size);
                    instance.add_client(RcClient::downgrade(self), name);
                    *self.instance.borrow_mut() = Some(instance);
                    Ok(())
                }
                Ok(Request::EXIT_GAME) => {
                    self.instance
                        .borrow()
                        .as_ref()
                        .map(|i| i.remove_client(self.id, false));
                    self.clear_instance();
                    Ok(())
                }
                Ok(data) => {
                    self.instance
                        .borrow()
                        .as_ref()
                        .map(|i| i.process(self.id, data));
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
        self.instance
            .borrow()
            .as_ref()
            .map(|instance| instance.remove_client(self.id, false));
        self.server.remove_client(self.id, false);

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

pub trait SharedClient {
    fn clear_instance(&self);
    fn disconnect(&self);
}

impl SharedClient for RcClient {
    fn clear_instance(&self) {
        let mut temp = self.instance.borrow_mut();
        temp.as_ref().map(|i| {
            debug!(
                "Client (id: {}) disconnected from instance (id: {}).",
                self.id,
                i.upgrade().unwrap().id
            )
        });
        *temp = None;
    }

    fn disconnect(&self) {
        self.out
            .close(ws::CloseCode::Normal)
            .expect("Error when closing connection");
    }
}

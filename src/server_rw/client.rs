use uuid::Uuid;
use std::rc::{Rc, Weak};
use std::cell::RefCell;
use std::collections::HashMap;
use serde_json;
use super::Server;
use data::{Request, Response};
use super::instance::{Instance, SharedInstance};
use ws;
use std::ops::Deref;

pub struct ClientHandler {
    pub id: Uuid,

    pub server: Weak<Server>,
    pub instance: Option<Weak<Instance>>,

    pub out: Rc<ws::Sender>,
}

pub struct Client(ClientHandler);

impl Deref for Client {
    type Target = ClientHandler;

    fn deref(&self) -> &ClientHandler {
        &self.0
    }
}

impl ws::Handler for Client {
    fn on_message(&mut self, msg: ws::Message) -> ws::Result<()> {
        self.0.on_message(msg)
    }

    fn on_open(&mut self, shake: ws::Handshake) -> ws::Result<()> {
        self.0.on_open(shake)
    }

    fn on_request(&mut self, req: &ws::Request) -> ws::Result<ws::Response> {
        self.0.on_request(req)
    }

    fn on_close(&mut self, code: ws::CloseCode, reason: &str) {
        self.0.on_close(code, reason)
    }
}

impl ws::Handler for ClientHandler {
    fn on_message(&mut self, msg: ws::Message) -> ws::Result<()> {
        Ok(())
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
            .as_ref()
            .map(|instance| instance.remove_client(self.id, false));

        match code {
            ws::CloseCode::Normal => debug!("Client (id: {}) has closed the connection.", self.id),
            ws::CloseCode::Away => debug!("Client (id: {}) is leaving the website.", self.id),
            _ => println!(
                "Client (id: {}) has encountered an error ({:?}): {}.",
                self.id, code, reason
            ),
        }
    }
}

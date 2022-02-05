use std::collections::HashMap;

use actix::prelude::*;
use actix_web::web::Bytes;
use actix_web_actors::ws::Message as WsMessage;
use log::trace;
use uuid::Uuid;

use crate::client::Client;

/// Messages sent to the socket connection.
#[derive(Debug)]
pub struct OutgoingMessage(pub WsMessage);
impl Message for OutgoingMessage {
    type Result = ();
}

/// String messages sent from the socket connection.
#[derive(Debug)]
pub struct IncomingMessage {
    pub uuid: Uuid,
    pub text: Bytes,
}
impl Message for IncomingMessage {
    type Result = ();
}

/// Central struct that stores the concierge data.
pub struct Server {
    /// This is the mapping between UUID and Clients.
    /// Statistically, the 128-bit UUIDs generated will not collide.
    pub clients: HashMap<Uuid, Client>,
}

impl Actor for Server {
    /// Using a simple Context, since we just need the ability
    /// to communicate with other actors.
    type Context = Context<Self>;
}

impl Server {
    pub fn new() -> Self {
        Self {
            clients: HashMap::new(),
        }
    }

    // /// Handle message payloads.
    // fn handle_message<'a>(
    //     &self,
    //     client_uuid: Uuid,
    //     payload: PayloadMessage<'a, &'a serde_json::value::RawValue>,
    // ) {

    // }
}

impl Handler<IncomingMessage> for Server {
    type Result = ();

    fn handle(&mut self, msg: IncomingMessage, _: &mut Context<Self>) {
        let IncomingMessage { uuid, text } = msg;
        // trace!("Client (uuid: {}) sent message: {}", uuid, text);

        // // Prioritize trying to parse messages (since they are the primary form of function).
        // if let Ok(payload) = serde_json::from_str(&text) {
        //     // self.handle_message(uuid, payload);
        // } else {
        //     // Parse other payloads.
        //     match serde_json::from_str(&text) {
        //         Ok(payload) => {
        //             // self.handle_payload(uuid, payload);
        //         }
        //         Err(err) => {
        //             // self.clients
        //             //     .get(&uuid)
        //             //     .unwrap()
        //             //     .send(&PayloadOut::error_protocol(&err.to_string()).seq(seq));
        //         }
        //     }
        // }

        // self.clients.get_mut(&uuid).unwrap().seq += 1;
    }
}

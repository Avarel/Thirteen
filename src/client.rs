use actix::Recipient;
use uuid::Uuid;

use crate::server::OutgoingMessage;

/// A struct holding information regarding the client.
pub struct Client {
    /// Client id.
    pub uuid: Uuid,
    /// Client name.
    pub name: String,
    /// Actor address for a recipient that
    /// receives messages from the central server.
    pub addr: Recipient<OutgoingMessage>,
}
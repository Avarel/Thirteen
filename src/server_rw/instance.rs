use uuid::Uuid;
use std::rc::{Rc, Weak};
use std::cell::RefCell;
use std::collections::HashMap;
use game::Game;

use super::Server;
use data::{Request, Response};
use super::client::ClientHandler;
use ws;

pub struct Instance {
    pub id: Uuid,
    pub size: usize,
    server: *mut Server,

    game: Game,
    connections: HashMap<Uuid, *mut ClientHandler>,
}

impl Instance {
    pub fn new(size: usize, server: *mut Server) -> Self {
        let id = Uuid::new_v4();
        debug!("Creating a new instance (id: {}, size: {}).", id, size);
        Instance {
            id,
            size,
            server,
            game: Game::new(),
            connections: HashMap::with_capacity(size),
        }
    }

    pub fn destroy(self) {
        debug!(
            "Destroying instance (id: {}, size: {}).",
            self.id, self.size
        );
    }
}

impl Instance {
    pub fn process(&mut self, client_id: Uuid, data: Request) {
        debug!("Received request from client (id: {})", client_id);
    }

    pub fn add_client(&mut self, client: *mut ClientHandler, name: String) {
        let id = unsafe { &*client }.id;

        debug!("Connecting client (id: {}) to instance (id: {}, size: {})", id, self.id, self.size);
        self.connections.insert(id, client);

        self.broadcast(&Response::QUEUE_UPDATE {
			size: self.connections.len(),
			goal: self.size,
		});
    }

    pub fn remove_client(&mut self, client_id: Uuid, disconnect: bool) {
        let client = self.connections
            .remove(&client_id)
            .expect("Tried to remove an invalid client");
        if disconnect {
            let temp = unsafe { &mut *client };
            temp.clear_instance();
            temp.disconnect();
        }
    }

    fn broadcast(&self, data: &Response) {
        self.connections.values().map(|c| unsafe { &**c }).for_each(|c| c.send(data));
    }
}

impl Drop for Instance {
    fn drop(&mut self) {
        debug!("Dropping instance (id: {}).", self.id);
    }
}
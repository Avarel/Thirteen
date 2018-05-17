use uuid::Uuid;
use std::rc::{Rc, Weak};
use std::cell::RefCell;
use std::collections::HashMap;
use game::Game;

use super::Server;
use data::{Request, Response};
use super::client::{WeakClient, SharedClient};
use ws;

pub struct Instance {
    pub id: Uuid,
    pub size: usize,
    server: Weak<Server>,

    game: RefCell<Game>,
    connections: RefCell<HashMap<Uuid, WeakClient>>,
}


impl Instance {
    pub fn new(size: usize, server: Weak<Server>) -> Self {
        let id = Uuid::new_v4();
        debug!("Creating a new instance (id: {}, size: {}).", id, size);
        Instance {
            id,
            size,
            server,
            game: RefCell::new(Game::new()),
            connections: RefCell::new(HashMap::with_capacity(size)),
        }
    }

    pub fn destroy(self) {
        debug!(
            "Destroying instance (id: {}, size: {}).",
            self.id, self.size
        );
    }
}

pub trait SharedInstance {
    fn process(&self, client_id: Uuid, data: Request);
    fn add_client(&self, client: WeakClient, name: String);
    fn remove_client(&self, client_id: Uuid, disconnect: bool);
}

impl SharedInstance for Rc<Instance> {
    fn process(&self, client_id: Uuid, data: Request) {
        debug!("Received request from client (id: {})", client_id);
    }

    fn add_client(&self, client: WeakClient, name: String) {
        let id = client.upgrade().unwrap().id;
        debug!("Connecting client (id: {}) to instance (id: {}, size: {})", id, self.id, self.size);
        self.connections.borrow_mut().insert(id, client);
    }

    fn remove_client(&self, client_id: Uuid, disconnect: bool) {
        let client = self.connections
            .borrow_mut()
            .remove(&client_id)
            .expect("Tried to remove an invalid client");
        if disconnect {
            let temp = client.upgrade().unwrap();
            temp.clear_instance();
            temp.disconnect();
        }
    }
}

impl SharedInstance for Weak<Instance> {
    fn process(&self, client_id: Uuid, data: Request) {
        self.upgrade().unwrap().process(client_id, data);
    }

    fn add_client(&self, client: WeakClient, name: String) {
        self.upgrade().unwrap().add_client(client, name);
    }

    fn remove_client(&self, client_id: Uuid, disconnect: bool) {
        self.upgrade().unwrap().remove_client(client_id, disconnect);
    }
}

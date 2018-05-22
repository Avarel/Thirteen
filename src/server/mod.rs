mod client;
mod game;
mod instance;

use std::collections::HashMap;
use uuid::Uuid;
use ws;

use self::client::ClientHandler;
use self::instance::Instance;

pub const PROTOCOL: &'static str = "thirteen-game";

pub struct Server {
    pub pending_instances: HashMap<Uuid, Instance>,
    pub running_instances: HashMap<Uuid, Instance>,
    pub clients: HashMap<Uuid, *mut ClientHandler>,
}

impl Server {
    pub fn new_instance(&mut self, size: usize) -> Uuid {
        let instance = Instance::new(size, self as *mut Server);
        let id = instance.id;
        self.pending_instances.insert(instance.id, instance);
        id
    }

    pub fn get_client(&mut self, id: Uuid) -> Option<&mut ClientHandler> {
        self.clients.get_mut(&id).map(|c| unsafe { &mut **c })
    }

    pub fn get_instance(&mut self, id: Uuid) -> Option<&mut Instance> {
        match self.running_instances.get_mut(&id) {
            Some(i) => Some(i),
            None => self.pending_instances.get_mut(&id),
        }
    }

    pub fn find_instance(&mut self, size: usize) -> Option<Uuid> {
        self.pending_instances
            .values()
            .find(|i| i.size == size)
            .map(|i| i.id)
    }

    pub fn find_or_new_instance(&mut self, size: usize) -> Uuid {
        self.find_instance(size)
            .unwrap_or_else(|| self.new_instance(size))
    }

    pub fn upgrade_instance(&mut self, id: Uuid) {
        self.running_instances
            .insert(id, self.pending_instances.remove(&id).unwrap());
    }

    pub fn remove_instance(&mut self, id: Uuid) {
        self.running_instances
            .remove(&id)
            .expect("Tried to remove invalid instance")
            .destroy()
    }

    // THIS MUST BE GIVEN TO SOMETHING THAT WILL PERSISTENTLY OWN IT
    pub fn new_client(&mut self, out: ws::Sender) -> ClientHandler {
        let mut client = ClientHandler {
            id: Uuid::new_v4(),
            server: self as *mut Server,
            instance_id: None,
            out: out,
        };

        debug!("Creating a new client (id: {}).", client.id);

        self.clients
            .insert(client.id, &mut client as *mut ClientHandler);
        client
    }

    pub fn remove_client(&mut self, id: Uuid, disconnect: bool) {
        let client = self.clients.remove(&id).unwrap();
        if disconnect {
            let temp = unsafe { &mut *client };
            debug!("Client (id: {}) kicked by the server.", temp.id);
            temp.disconnect();
        }
    }
}

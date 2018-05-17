mod client;
mod game;
mod instance;

use data::{Request, Response};
use game::*;
use serde_json;
use std::cell::RefCell;
use std::collections::HashMap;
use std::rc::{Rc, Weak};
use uuid::Uuid;
use ws;

use self::client::{ClientHandler, RcClient, WeakClient, SharedClient};
use self::instance::Instance;

pub const PROTOCOL: &'static str = "thirteen-game";

pub fn start_server() {
    info!("Starting server.");

    let server = Rc::new(Server {
        pending_instances: HashMap::new().into(),
        running_instances: HashMap::new().into(),
        clients: HashMap::new().into(),
    });

    ws::listen("127.0.0.1:2794", |out| server.new_client(out)).unwrap();
}

pub struct Server {
    pending_instances: RefCell<HashMap<Uuid, Rc<Instance>>>,
    running_instances: RefCell<HashMap<Uuid, Rc<Instance>>>,
    clients: RefCell<HashMap<Uuid, WeakClient>>,
}

trait SharedServer {
    fn new_instance(&self, size: usize) -> Weak<Instance>;
    fn find_instance(&self, size: usize) -> Option<Weak<Instance>>;
    fn find_or_new_instance(&self, size: usize) -> Weak<Instance>;
    fn upgrade_instance(&self, id: Uuid);
    fn remove_instance(&self, id: Uuid);
    fn new_client(&self, out: ws::Sender) -> RcClient;
    fn remove_client(&self, id: Uuid, disconnect: bool);
}

impl SharedServer for Rc<Server> {
    fn new_instance(&self, size: usize) -> Weak<Instance> {
        let instance = Instance::new(size, Rc::downgrade(self)).into();
        let weak = Rc::downgrade(&instance);
        self.running_instances
            .borrow_mut()
            .insert(instance.id, instance);
        weak
    }

    fn find_instance(&self, size: usize) -> Option<Weak<Instance>> {
        self.pending_instances
            .borrow()
            .values()
            .find(|i| i.size == size)
            .map(Rc::downgrade)
    }

    fn find_or_new_instance(&self, size: usize) -> Weak<Instance> {
        self.find_instance(size)
            .unwrap_or_else(|| self.new_instance(size))
    }

    fn upgrade_instance(&self, id: Uuid) {
        self.running_instances
            .borrow_mut()
            .insert(id, self.pending_instances.borrow_mut().remove(&id).unwrap());
    }

    fn remove_instance(&self, id: Uuid) {
        Rc::try_unwrap(
            self.running_instances
                .borrow_mut()
                .remove(&id)
                .expect("Tried to remove invalid instance"),
        ).ok()
            .unwrap()
            .destroy()
    }

    fn new_client(&self, out: ws::Sender) -> RcClient {
        let client = RcClient(Rc::new(ClientHandler {
            id: Uuid::new_v4(),
            server: Rc::downgrade(self),
            instance: None.into(),
            out: out.into(),
        }));

        debug!("Creating a new client (id: {}).", client.id);

        self.clients.borrow_mut().insert(client.id, RcClient::downgrade(&client));
        client
    }

    fn remove_client(&self, id: Uuid, disconnect: bool) {
        let client = self.clients.borrow_mut().remove(&id).unwrap();
        if disconnect {
            let temp = client.upgrade().unwrap();
            debug!("Client (id: {}) kicked by the server.", temp.id);
            temp.disconnect();
        }
    }
}

impl SharedServer for Weak<Server> {
    fn new_instance(&self, size: usize) -> Weak<Instance> {
        self.upgrade().unwrap().new_instance(size)
    }

    fn find_instance(&self, size: usize) -> Option<Weak<Instance>> {
        self.upgrade().unwrap().find_instance(size)
    }

    fn find_or_new_instance(&self, size: usize) -> Weak<Instance> {
        self.upgrade().unwrap().find_or_new_instance(size)
    }

    fn upgrade_instance(&self, id: Uuid) {
        self.upgrade().unwrap().upgrade_instance(id)
    }

    fn remove_instance(&self, id: Uuid) {
        self.upgrade().unwrap().remove_instance(id)
    }

    fn new_client(&self, out: ws::Sender) -> RcClient {
        self.upgrade().unwrap().new_client(out)
    }

    fn remove_client(&self, id: Uuid, disconnect: bool) {
        self.upgrade().unwrap().remove_client(id, disconnect)
    }
}
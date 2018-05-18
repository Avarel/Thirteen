#![feature(iterator_step_by)]
#![feature(try_from)]
#![allow(dead_code)]

#[macro_use] 
extern crate log;
extern crate env_logger;

extern crate serde;
extern crate serde_json;
#[macro_use]
extern crate serde_derive;

extern crate linked_hash_map;
extern crate rand;
extern crate uuid;
extern crate ws;

pub mod data;
pub mod cards;
pub mod game;
pub mod server;

// rewrite of server backend, not in effect yet
pub mod server_rw;

mod utils;

use std::collections::HashMap;
use server_rw::Server;

fn main() -> ws::Result<()> {
    env_logger::Builder::new().filter_level(log::LevelFilter::Debug).init();
    
    info!("Starting server.");

    let mut server = Server {
        pending_instances: HashMap::new(),
        running_instances: HashMap::new(),
        clients: HashMap::new(),
    };

    ws::listen("127.0.0.1:2794", |out| server.new_client(out))
}
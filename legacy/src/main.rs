#![feature(iterator_step_by, vec_remove_item)]
#![allow(dead_code)]

#[macro_use]
extern crate log;
extern crate env_logger;

extern crate serde;
extern crate serde_json;
#[macro_use]
extern crate serde_derive;

extern crate rand;
extern crate uuid;
extern crate ws;

pub mod cards;
pub mod data;

pub mod server;

mod utils;

use server::Server;
use std::collections::HashMap;

fn main() -> ws::Result<()> {
    env_logger::Builder::new()
        .filter_level(log::LevelFilter::Debug)
        .filter_module("ws::handler", log::LevelFilter::Info)
        .init();

    info!("Starting server.");

    let mut server = Server {
        pending_instances: HashMap::new(),
        running_instances: HashMap::new(),
        clients: HashMap::new(),
    };

    ws::listen("127.0.0.1:2794", |out| server.new_client(out))
}

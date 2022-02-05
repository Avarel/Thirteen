mod client;
mod close_reason;
mod server;
mod ws;

use actix::prelude::*;
use actix_files::Files;
use actix_web::{
    middleware,
    web::{self, Data},
    App, HttpServer, Responder,
};
use server::Server;

use std::net::SocketAddr;

// Listen on every available network interface
pub const SOCKET_ADDR: ([u8; 4], u16) = ([0, 0, 0, 0], 64209);
pub const VERSION: &str = "0.2.0";
pub const MIN_VERSION: &str = "^0.2.0";
pub const SECRET: Option<&str> = None;

#[actix_rt::main]
async fn main() -> std::io::Result<()> {
    env_logger::Builder::new()
        .filter_level(log::LevelFilter::Debug)
        .init();

    HttpServer::new(move || {
        let server = Server::new();

        App::new()
            // .data("123")
            .app_data(Data::new(server))
        .service(
            Files::new("/game", "./web/dist")
                .show_files_listing()
                .use_last_modified(true),
        )
        .wrap(middleware::Logger::default())
        .service(web::resource("/ws").route(web::get().to(ws::index)))
    })
    .bind(SocketAddr::from(SOCKET_ADDR))?
    .run()
    .await
}

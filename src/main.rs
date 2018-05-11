#![feature(iterator_step_by)]
#![feature(try_from)]
#![allow(dead_code)]

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
pub mod server2;
mod utils;

fn main() {
    // use std::thread;
    // let thread = thread::spawn(move || {
    server::start_server();
    // });

    // println!("Started the Thirteen server!");
    // thread.join().unwrap();

    // let mut game = game::Game::new();
    // game.add_player();
    // game.add_player();
    // game.start();
    // println!("{:?}", game.player(1));
}

#[test]
fn triple_sequence_pair_vs_single_two() {
    use cards::{Card, Suit};
    use game::Turn;
    assert!(
        Turn::from(&[
            Card::new_unchecked(2, Suit::Diamonds),
            Card::new_unchecked(2, Suit::Diamonds),
            Card::new_unchecked(3, Suit::Diamonds),
            Card::new_unchecked(3, Suit::Diamonds),
            Card::new_unchecked(4, Suit::Diamonds),
            Card::new_unchecked(4, Suit::Diamonds),
        ] as &[Card])
            .gt(&Turn::from(&[Card::new_unchecked(1, Suit::Hearts),] as &[Card])),
        "Sequence pair of 3 is supposed to beat a single 2"
    );
}

#[test]
fn quad_sequence_pair_vs_pair_two() {
    use cards::{Card, Suit};
    use game::Turn;
    assert!(
        Turn::from(&[
            Card::new_unchecked(2, Suit::Diamonds),
            Card::new_unchecked(2, Suit::Diamonds),
            Card::new_unchecked(3, Suit::Diamonds),
            Card::new_unchecked(3, Suit::Diamonds),
            Card::new_unchecked(4, Suit::Diamonds),
            Card::new_unchecked(4, Suit::Diamonds),
            Card::new_unchecked(5, Suit::Diamonds),
            Card::new_unchecked(5, Suit::Diamonds),
        ] as &[Card])
            .gt(&Turn::from(&[
            Card::new_unchecked(1, Suit::Diamonds),
            Card::new_unchecked(1, Suit::Hearts)
        ] as &[Card])),
        "Sequence pair of 4 is supposed to beat a pair of 2"
    );
}

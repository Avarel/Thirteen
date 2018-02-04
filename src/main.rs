#![feature(iterator_step_by)]
#![feature(exclusive_range_pattern)]
#![feature(try_from)]

extern crate tokio_core;
extern crate rand;
extern crate timer;
extern crate chrono;
extern crate evzht9h3nznqzwl as websocket;

pub mod game;
pub mod cards;
pub mod server;
mod utils;

fn main() {
    use std::thread;
    // let thread = thread::spawn(move || {
        server::start_server();
    // });
    
    // println!("Started the Thirteen server!");
    // thread.join().unwrap();
}

#[test]
fn triple_sequence_pair_vs_single_two() {
    use cards::{Card, Suit};
    use game::Play;
    assert!(Play::from(&[
        Card::new_unchecked(2, Suit::Diamonds),
        Card::new_unchecked(2, Suit::Diamonds),
        Card::new_unchecked(3, Suit::Diamonds),
        Card::new_unchecked(3, Suit::Diamonds),
        Card::new_unchecked(4, Suit::Diamonds),
        Card::new_unchecked(4, Suit::Diamonds),
    ] as &[Card]).gt(
        &Play::from(&[
            Card::new_unchecked(1, Suit::Hearts),
        ] as &[Card])
    ), "Sequence pair of 3 is supposed to beat a single 2");
}

#[test]
fn quad_sequence_pair_vs_pair_two() {
    use cards::{Card, Suit};
    use game::Play;
    assert!(Play::from(&[
        Card::new_unchecked(2, Suit::Diamonds),
        Card::new_unchecked(2, Suit::Diamonds),
        Card::new_unchecked(3, Suit::Diamonds),
        Card::new_unchecked(3, Suit::Diamonds),
        Card::new_unchecked(4, Suit::Diamonds),
        Card::new_unchecked(4, Suit::Diamonds),
        Card::new_unchecked(5, Suit::Diamonds),
        Card::new_unchecked(5, Suit::Diamonds),
    ] as &[Card]).gt(
        &Play::from(&[
            Card::new_unchecked(1, Suit::Diamonds),
            Card::new_unchecked(1, Suit::Hearts)] as &[Card])
    ), "Sequence pair of 4 is supposed to beat a pair of 2");
}
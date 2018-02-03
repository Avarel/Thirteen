extern crate rand;
extern crate websocket;

pub mod game;
pub mod cards;
mod utils;

fn main() {
    // let mut deck = cards::new_deck();


    // deck.sort();
    
    // println!("{:?}", deck.iter().map(cards::Card::to_string).collect::<Vec<_>>());

    // println!("{:?}", cards::partition(cards::shuffled_deck()));

    use cards::{Card, Suit};
    println!("{:?}", game::Pattern::of(&[
        Card { value: 3, suit: Suit::Spades },
        Card { value: 3, suit: Suit::Clubs },
        Card { value: 4, suit: Suit::Spades },
        Card { value: 4, suit: Suit::Clubs },
    ]))
}

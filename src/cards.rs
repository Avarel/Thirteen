use std::fmt;
use std::cmp;

/// Return a deck partioned into 4 equal hands.
pub fn partitioned_deck() -> [[Card; 13]; 4] {
    partition(shuffled_deck())
}

/// Return a new shuffled deck of cards.
pub fn shuffled_deck() -> [Card; 52] {
    let mut deck = new_deck();
    use utils;
    utils::shuffle(&mut deck);
    deck
}

/// Return a new sorted deck of cards.
pub fn new_deck() -> [Card; 52] {
    let mut deck = [Card { value: 0, suit: Suit::Spades }; 52];
    for (i, suit) in [Suit::Spades, Suit::Clubs, Suit::Diamonds, Suit::Hearts].iter().enumerate() {
        for j in 0..13 {
            let card = &mut deck[i * 13 + j];
            card.value = j as u8;
            card.suit = *suit;
        }
    }
    deck
}

/// Partition a full deck of cards (52 cards) into 4 deals of 13 cards each.
#[inline]
pub fn partition(source: [Card; 52]) -> [[Card; 13]; 4] {
    use std::mem;
    unsafe { mem::transmute(source) }
}

/// Represents a real playing card.
/// `value` should be between 0..12 inclusive.
/// `suit` can be one of the Suits (Spades < Clubs < Diamonds < Hearts)
#[derive(Debug, Copy, Clone, Eq, PartialEq)]
pub struct Card {
    pub value: u8,
    pub suit: Suit
}

impl Card {
    pub fn vc_value(&self) -> u8 {
        match self.value {
            0 => 11,
            1 => 12,
            x => x - 2
        }
    }
}

impl fmt::Display for Card {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self.value {
            0 => write!(f, "Ace of {}", self.suit),
            10 => write!(f, "Jack of {}", self.suit),
            11 => write!(f, "Queen of {}", self.suit),
            12 => write!(f, "King of {}", self.suit),
            _ => write!(f, "{} of {}", self.value + 1, self.suit),
        }
    }
}

impl cmp::Ord for Card {
    fn cmp(&self, other: &Self) -> cmp::Ordering {
        let ord = self.vc_value().cmp(&other.vc_value());
        if ord == cmp::Ordering::Equal { self.suit.cmp(&other.suit) } else { ord }
    }
}

impl cmp::PartialOrd for Card {
    fn partial_cmp(&self, other: &Self) -> Option<cmp::Ordering> {
        Some(self.cmp(other))
    }
}

// Represents a playing card's possible suits.
#[derive(Debug, Copy, Clone, Eq, PartialEq, Ord, PartialOrd)]
pub enum Suit {
    Spades,
    Clubs,
    Diamonds,
    Hearts,
}

impl fmt::Display for Suit {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match *self {
            Suit::Spades => write!(f, "Spades"),
            Suit::Clubs => write!(f, "Clubs"),
            Suit::Diamonds => write!(f, "Diamonds"),
            Suit::Hearts => write!(f, "Hearts"),
        }
    }
}
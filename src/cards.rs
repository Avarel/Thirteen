use std::fmt;
use std::cmp;

#[inline]
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

#[inline]
/// Return a new sorted deck of cards.
pub fn new_deck() -> [Card; 52] {
    let mut deck = [Card(0); 52];
    for i in 0..52 { deck[i].0 = i as u8 }
    deck
}

#[inline]
/// Partition a full deck of cards (52 cards) into 4 deals of 13 cards each.
pub fn partition(source: [Card; 52]) -> [[Card; 13]; 4] {
    use std::mem;
    unsafe { mem::transmute(source) }
}

/// Represents a real playing card. The only field represents the id of the card.
#[derive(Debug, Copy, Clone, Eq, PartialEq)]
pub struct Card(u8);

impl Card {
    #[inline]
    /// Construct a Card from a value and suit. This 
    /// makes sure that the value of the card is within
    /// valid bounds.
    /// 
    /// Returns None if invalid, returns Some(Card) otherwise.
    pub fn new(value: u8, suit: Suit) -> Option<Card> {
        if value > 12 { None }
        else { Some(Self::new_unchecked(value, suit)) }
    }

    #[inline]
    /// Construct a Card from a value and suit. This
    /// does not check that the value is within valid
    /// bounds. If the value is not between `0..13` 
    /// (last exlusive), then the Card will represent
    /// another Card.
    pub fn new_unchecked(value: u8, suit: Suit) -> Card {
        Card(match suit {
            Suit::Spades => value,
            Suit::Clubs => value + 13,
            Suit::Diamonds => value + 26,
            Suit::Hearts =>  value + 39,
        })
    }

    /// Represents the face value of the card.
    pub fn face_value(&self) -> u8 {
        match self.suit() {
            Suit::Spades => self.0,
            Suit::Clubs => self.0 - 13,
            Suit::Diamonds => self.0 - 26,
            Suit::Hearts =>  self.0 - 39,
        }
    }

    /// Represents the suit of the card.
    pub fn suit(&self) -> Suit {
        match self.0 {
            0..13 => Suit::Spades,
            13..26 => Suit::Clubs,
            26..39 => Suit::Diamonds,
            39..52 => Suit::Hearts,
            _ => unreachable!()
        }
    }

    /// Represents the value of the card in the game thirteen.
    pub fn vc_value(&self) -> u8 {
        match self.face_value() {
            0 => 11,
            1 => 12,
            x => x - 2
        }
    }

    /// Convert a card into an id for completeness sake.
    #[inline]
    pub fn into_id(&self) -> u8 {
        self.0
    }

    /// Safely convert an id to a card.
    #[inline]
    pub fn from_id(id: u8) -> Option<Card> {
        if id < 52 { Some(Card(id)) }
        else { None }
    }
}

impl fmt::Display for Card {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self.face_value() {
            0 => write!(f, "Ace of {}", self.suit()),
            10 => write!(f, "Jack of {}", self.suit()),
            11 => write!(f, "Queen of {}", self.suit()),
            12 => write!(f, "King of {}", self.suit()),
            _ => write!(f, "{} of {}", self.face_value() + 1, self.suit()),
        }
    }
}

impl cmp::Ord for Card {
    fn cmp(&self, other: &Self) -> cmp::Ordering {
        let ord = self.vc_value().cmp(&other.vc_value());
        if ord == cmp::Ordering::Equal { self.suit().cmp(&other.suit()) } else { ord }
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
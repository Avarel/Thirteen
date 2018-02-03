use std::fmt;
use cards::Card;

#[derive(Debug, Copy, Clone, Eq, PartialEq)]
pub enum Pattern {
    Repeat(u8),       // Repeats (ie: [3, 3]) of 1..4
    Sequence(u8),     // Sequence (ie: [3, 4, 5...]) of a certain length >= 3
    SequencePair(u8), // Sequence of pairs (ie: [3, 3, 4, 4, 5, 5]) of a certain length >= 3
    Invalid           // Invalid play
}

impl Pattern {
    // pub fn valid(top_card: Card, current: Pattern, attempt: Pattern) -> bool {
    //     match current {
    //         Pattern::Repeat(1) => {
    //             top_card.vc_value() == 13 && attempt == Pattern::Repeat(4)
    //                 || attempt == Pattern::SequencePair(4)
    //         }
    //         Pattern::Repeat(2) => top_card.vc_value() == 13 && attempt == Pattern::SequencePair(5),
    //         _ => current == attempt,
    //     }
    // }

    pub fn check_sequence_pair(source: &[Card]) -> bool {
        source.len() >= 6 &&
            source.chunks(2).all(|pair| pair[0].vc_value() == pair[1].vc_value()) 
            && Self::check_sequence(&source.chunks(2).map(|x| x[1]).collect::<Vec<_>>())
    }

    pub fn check_sequence(source: &[Card]) -> bool {
        source.len() >= 3 
            && source.iter().enumerate().all(|(index, card)| card.vc_value() == source[0].vc_value() + index as u8) 
    }

    pub fn check_repeat(source: &[Card]) -> bool {
        source.len() >= 1 
            && source.iter().all(|x| x.value == source[0].value)
    }

    /// Retrn Some(Pattern) if valid, else None
    pub fn of(source: &[Card]) -> Pattern {
        if source.len() == 1 { Pattern::Repeat(1) }
        else if Self::check_repeat(source) { Pattern::Repeat(source.len() as u8) }
        else if Self::check_sequence(source) { Pattern::Sequence(source.len() as u8) }
        else if Self::check_sequence_pair(source) { Pattern::SequencePair((source.len() / 2) as u8) }
        else { Pattern::Invalid }
    }
}

impl fmt::Display for Pattern {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match *self {
            Pattern::Repeat(1) => write!(f, "Single"),
            Pattern::Repeat(2) => write!(f, "Double"),
            Pattern::Repeat(3) => write!(f, "Triple"),
            Pattern::Repeat(4) | Pattern::SequencePair(_) => write!(f, "Bomb"),
            Pattern::Sequence(x) => write!(f, "Sequence of {}", x),
            _ => write!(f, "Invalid")
        }
    }
}
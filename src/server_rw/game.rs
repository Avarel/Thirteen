use cards::Card;
use std::{collections::HashMap, fmt};
use uuid::Uuid;

#[derive(Debug, Copy, Clone, Eq, PartialEq)]
pub enum Pattern {
    Single,
    Repeat(u8),
    Sequence(u8),
    SequencePair(u8),
    Invalid, // Invalid play
}

impl Pattern {
    /// Check for a sequence of pairs.
    /// ie: [3, 3, 4, 4, 5, 5] of a certain length >= 3 (6 cards)
    fn check_sequence_pair(source: &[Card]) -> bool {
        source.len() >= 6 && source.last().unwrap().vc_value() != 12
            && source
                .chunks(2)
                .all(|pair| pair[0].vc_value() == pair[1].vc_value())
            && Self::check_sequence(&source.iter().step_by(2).cloned().collect::<Vec<_>>())
    }

    /// Check for n-repeats.
    /// ie: [3, 3] of 1..4
    /// Can also represent single patterns
    fn check_sequence(source: &[Card]) -> bool {
        source.len() >= 3 && source.last().unwrap().vc_value() != 12
            && source
                .iter()
                .enumerate()
                .all(|(index, card)| card.vc_value() == source[0].vc_value() + index as u8)
    }

    /// Check for a sequence.
    /// ie: [3, 4, 5...] of a certain length >= 3
    fn check_repeat(source: &[Card]) -> bool {
        source.len() > 1 && source.len() <= 4
            && source.iter().all(|x| x.vc_value() == source[0].vc_value())
    }

    /// Retrn Some(Pattern) if valid, else None
    pub fn of(source: &[Card]) -> Pattern {
        if source.len() == 1 {
            Pattern::Single
        } else if Self::check_repeat(source) {
            Pattern::Repeat(source.len() as u8)
        } else if Self::check_sequence(source) {
            Pattern::Sequence(source.len() as u8)
        } else if Self::check_sequence_pair(source) {
            Pattern::SequencePair((source.len() / 2) as u8)
        } else {
            Pattern::Invalid
        }
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
            _ => write!(f, "Invalid"),
        }
    }
}

#[derive(Clone, Copy, Debug)]
pub enum CurrentTurn {
    /// The player must play the designated card (the lowest card) this turn.
    FirstTurn {
        player_id: Uuid,
        required_card: Card,
    },

    /// Decides the direction of the game.
    SecondMultiTurn { player_ids: [Uuid; 2] },

    /// Normal turn.
    NormalTurn { player_id: Uuid },

    /// New turn, the player can not pass this turn.
    NewTurn { player_id: Uuid },
}

impl CurrentTurn {
    pub fn can_pass(&self) -> bool {
        match self {
            CurrentTurn::NormalTurn { .. } => true,
            _ => false,
        }
    }
}

#[derive(Debug)]
pub enum TurnDirection {
    Right,
    Left,
}

#[derive(Debug)]
pub struct Game {
    players: HashMap<Uuid, Player>,

    current_turn: Option<CurrentTurn>,
    turn_direction: Option<TurnDirection>,
    player_order: Vec<Uuid>,

    history: Vec<Event>,
}

impl Game {
    pub fn new() -> Self {
        Game {
            player_order: Vec::new(),
            players: HashMap::new(),
            current_turn: None,
            turn_direction: Some(TurnDirection::Right), /*None*/
            history: Vec::new(),
        }
    }

    pub fn players(&self) -> Vec<&Player> {
        self.player_order
            .iter()
            .map(|id| self.players.get(id).unwrap())
            .collect()
    }

    pub fn handle(&mut self, mut event: Event) -> Result<(), ActionError> {
        // Check if the player did it in turn.
        match self.current_turn.unwrap() {
            CurrentTurn::FirstTurn { player_id, .. }
            | CurrentTurn::NormalTurn { player_id }
            | CurrentTurn::NewTurn { player_id } => {
                if player_id != event.player_id {
                    return Err(ActionError::Pass(PassError::OutOfTurn));
                }
            }
            CurrentTurn::SecondMultiTurn { player_ids } => {
                if !player_ids.contains(&event.player_id) {
                    return Err(ActionError::Pass(PassError::OutOfTurn));
                }
            }
        };

        match event.action {
            Action::Pass => {
                if !self.current_turn.unwrap().can_pass() {
                    return Err(ActionError::Pass(PassError::MustPlay));
                }
            }
            Action::Play(ref mut current_cards) => {
                current_cards.sort();

                if current_cards.is_empty() {
                    return Err(ActionError::Play(PlayError::NoCards));
                } else if !self.players[&event.player_id].has_cards(&current_cards) {
                    return Err(ActionError::Play(PlayError::InvalidCard));
                }

                let current_pattern = Pattern::of(&current_cards);

                if current_pattern == Pattern::Invalid {
                    return Err(ActionError::Play(PlayError::InvalidPattern));
                }

                if let Some(CurrentTurn::FirstTurn { required_card, .. }) = self.current_turn {
                    if *current_cards.first().unwrap() != required_card {
                        return Err(ActionError::Play(PlayError::MustPlayLowest));
                    }
                } else if let Some(CurrentTurn::NewTurn { .. }) = self.current_turn {
                } else {
                    let previous_cards = match self.last_play().action {
                        Action::Pass => unreachable!(),
                        Action::Play(ref previous_cards) => previous_cards
                    };

                    let previous_pattern = Pattern::of(previous_cards);
                    match current_pattern {
                        Pattern::Repeat(4)
                            if previous_pattern == Pattern::Single
                                && previous_cards.last().unwrap().vc_value() == 12 => {}
                        Pattern::SequencePair(n)
                            if previous_pattern == Pattern::Repeat(n - 2)
                                && previous_cards.last().unwrap().vc_value() == 12 => {}
                        _ if current_pattern != previous_pattern => {
                            return Err(ActionError::Play(PlayError::BadPattern))
                        }
                        _ if current_cards.last().unwrap() > previous_cards.last().unwrap() => {}
                        _ => return Err(ActionError::Play(PlayError::BadCard)),
                    };
                }
            }
        }

        self.history.push(event);
        self.increment_turn();

        Ok(())
    }


    pub fn has_started(&self) -> bool {
        self.current_turn.is_some()
    }

    pub fn last_play(&self) -> &Event {
        self.history
            .iter()
            .rev()
            .skip_while(|e| e.action == Action::Pass)
            .nth(0)
            .unwrap()
    }

    fn increment_turn(&mut self) {
        match self.current_turn {
            None => {
                let (position, player_id, required_card) = self.players
                    .values()
                    .enumerate()
                    .min_by_key(|(_, p)| p.cards[0])
                    .map(|(i, p)| (i, p.id, p.cards[0]))
                    .unwrap();

                self.player_order.rotate_right(position);

                self.current_turn = Some(CurrentTurn::FirstTurn {
                    player_id,
                    required_card,
                });
            }
            // Assumption is that self.player_order[0] is always the current turn's player.
            Some(ref mut current_turn) => {
                match current_turn {
                    CurrentTurn::FirstTurn { .. } => {
                        if self.player_order.len() > 2 {
                            let id_0 = self.player_order[1];
                            let id_1 = *self.player_order.last().unwrap();
                            *current_turn = CurrentTurn::SecondMultiTurn {
                                player_ids: [id_0, id_1],
                            };
                            return;
                        }
                    }
                    // CurrentTurn::SecondMultiTurn { player_ids: [ref id_0, ref id_1] } => {
                    //     let id = self.history.last().unwrap().player_id;

                    //     self.turn_direction = if id == *id_0 {
                    //         Some(TurnDirection::Right)
                    //     } else if id == *id_1 {
                    //         Some(TurnDirection::Left)
                    //     } else {
                    //         unreachable!() // if you reach here then i really fucked up
                    //     }
                    // }
                    _ => {}
                };

                match self.turn_direction.as_ref().unwrap() {
                    TurnDirection::Right => self.player_order.rotate_right(1),
                    TurnDirection::Left => self.player_order.rotate_left(1),
                };

                let pass_count = self.history
                    .iter()
                    .rev()
                    .take_while(|e| e.action == Action::Pass)
                    .count();

                *current_turn = if pass_count >= self.players.len() - 1 {
                    CurrentTurn::NewTurn {
                        player_id: self.player_order[0],
                    }
                } else {
                    CurrentTurn::NormalTurn {
                        player_id: self.player_order[0],
                    }
                }
            }
        }
    }

    // fn pass_count(&self) -> usize {
    //     self.history.iter().rev().take_while(|e| e.action == Action::Pass).count()
    // }
}

#[derive(Debug)]
pub struct Event {
    player_id: Uuid,
    action: Action,
}

#[derive(PartialEq, Debug)]
pub enum Action {
    Play(Vec<Card>),
    Pass,
}

pub enum ActionError {
    /// Error when attempting to play.
    Play(PlayError),

    /// Error when attempting to pass.
    Pass(PassError),
}

pub enum PlayError {
    /// The player tried to play nothing.
    NoCards,

    /// The player played out of turn.
    OutOfTurn,

    /// The player tried to play cards that they did not have.
    InvalidCard,

    /// THe player tried to play an invalid pattern.
    InvalidPattern,

    /// The top card the player tried to play is lower than the pile's top card.
    BadCard,

    /// The pattern the player tried to play did not match the pile's pattern.
    BadPattern,

    /// The player must play their lowest card.
    MustPlayLowest,
}

pub enum PassError {
    /// The player passed out of turn.
    OutOfTurn,

    /// The player can not pass this turn.
    MustPlay,
}

#[derive(Debug)]
pub struct Player {
    id: Uuid,
    cards: Vec<Card>,
}

impl Player {
    pub fn add_cards(&mut self, cards: &[Card]) {
        cards.iter().for_each(|&c| self.cards.push(c))
    }

    // Remove instances of `cards` from the player's set of cards.
    pub fn remove_cards(&mut self, cards: &[Card]) {
        cards.iter().for_each(|c| {
            let pos = self.cards.binary_search(c).unwrap();
            self.cards.remove(pos);
        });
    }

    pub fn has_cards(&self, cards: &[Card]) -> bool {
        cards.iter().all(|c| self.cards.contains(c))
    }
}

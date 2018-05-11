use cards::Card;
use std::{fmt, collections::HashMap};
use uuid::Uuid;

#[derive(Debug, Copy, Clone, Eq, PartialEq)]
pub enum Pattern {
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
        source.len() >= 1 && source.iter().all(|x| x.vc_value() == source[0].vc_value())
    }

    /// Retrn Some(Pattern) if valid, else None
    pub fn of(source: &[Card]) -> Pattern {
        if source.len() == 1 {
            Pattern::Repeat(1)
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

pub enum PlayError {
    NoCards,        // player tried to play nothing
    OutOfTurn,
    InvalidCard,    // player tried to play cards that they don't have
    InvalidPattern, // pattern is illegal
    BadCard,        // top card lower than current top card
    BadPattern,     // wrong pattern compared to the pile
    MustPlayLowest, // at the start of game, player must play their lowest card
}

pub enum PassError {
    OutOfTurn,
    MustPlay,       // the player can not pass this turn
    MustPlayLowest, // the player must play on the first turn of the game
}

pub struct Game {
    started: bool, // has the game started

    new_pattern: bool,   // is it a new round? can you start a new pattern?
    pass_count: usize,   // how many people passed
    // current_turn: usize, // whose turn is it currently by id
    mandatory_card: Option<Card>,

    pub players: HashMap<Uuid, Player>, // cards of the players of the game
    turn_order: Vec<Uuid>,
    history: Vec<Turn>,   // past turns
}

impl Game {
    pub fn new() -> Self {
        Game {
            started: false,
            new_pattern: true,
            pass_count: 0,
            mandatory_card: None,
            players: HashMap::with_capacity(4),
            turn_order: Vec::new(),
            history: Vec::new(),
        }
    }

    // get an abstraction
    #[inline]
    pub fn player_handle(&mut self, id: Uuid) -> PlayerHandle {
        PlayerHandle {
            id,
            game: self,
        }
    }

    #[inline]
    pub fn players(&self) -> impl Iterator<Item=&Player> {
        // self.players.values().collect()
        // unimplemented!()
        self.players.values()
    }

    #[inline]
    pub fn current_player(&self) -> &Player {
        &self.players[&self.turn_order[0]]
    }

    #[inline]
    pub fn is_new_pattern(&self) -> bool {
        self.new_pattern
    }

    // add a new player and return their local id
    pub fn add_player(&mut self, id: Uuid, name: String) {
        if self.started || self.players.len() >= 4 {
            unimplemented!()
        }

        self.players.insert(id, Player {
            id,
            name,
            cards: Vec::new(),
        });
    }

    pub fn remove_player(&mut self, id: Uuid) {
        self.players.remove(&id);
    }

    pub fn start(&mut self) {
        if self.started {
            unimplemented!()
        }
        if self.players.len() == 0 {
            unimplemented!()
        }

        use cards::partitioned_deck;
        let mut decks = partitioned_deck();

        self.players.iter_mut().enumerate().for_each(|(i, (_,p))| {
            decks[i].sort();
            p.cards = decks[i].to_vec();
        });

        self.turn_order = self.players.keys().cloned().collect();

        // find lowest turn and force the card
        let (current_turn, card) = self.players.values()
            .min_by_key(|p| p.cards[0])
            .map(|p| (p.id, p.cards[0]))
            .unwrap();

        let rotate_amount = self.turn_order.iter().position(|&i| i == current_turn).unwrap();
        self.turn_order.rotate_right(rotate_amount);

        self.mandatory_card = Some(card);

        self.started = true;
    }

    fn next_turn(&mut self) { // todo implement direction
        self.turn_order.rotate_left(1);
    }
}

#[derive(Debug, Eq, PartialEq)]
pub struct Turn {
    pattern: Pattern,
    stack: Vec<Card>,
}

impl<'a> From<&'a [Card]> for Turn {
    #[inline]
    fn from(source: &'a [Card]) -> Turn {
        let mut stack = source.to_vec();
        stack.sort();

        Turn {
            pattern: Pattern::of(&stack),
            stack,
        }
    }
}

impl Turn {
    #[inline]
    pub fn top_card(&self) -> &Card {
        self.stack.last().unwrap()
    }
}

pub enum TurnError {
    BadCard,
    BadPattern,
}

#[derive(Debug)]
pub struct Player {
    pub id: Uuid,
    pub name: String,
    cards: Vec<Card>,
}

pub struct PlayerHandle<'game> {
    id: Uuid,
    game: &'game mut Game,
}

// abstraction to make player handling easier
impl<'game> PlayerHandle<'game> {
    #[inline]
    pub fn cards(&self) -> &[Card] {
        &self.game.players.get(&self.id).unwrap().cards
    }

    #[inline]
    pub fn cards_mut(&mut self) -> &mut Vec<Card> {
        &mut self.game.players.get_mut(&self.id).unwrap().cards
    }

    pub fn add_cards(&mut self, cards: &[Card]) {
        cards.iter().for_each(|&c| self.cards_mut().push(c))
    }

    // remove cards if the player have that card
    pub fn remove_cards(&mut self, cards: &[Card]) {
        cards.iter().for_each(|c| {
            self.cards()
                .iter()
                .position(|x| x == c)
                .map(|pos| self.cards_mut().remove(pos));
        });
    }

    pub fn has(&self, cards: &[Card]) -> bool {
        cards.iter().all(|c| self.cards().contains(c))
    }

    // Ok(bool)
    //      true if the player won, false if the game continues
    // Err(TurnError)
    //      player made an game error
    pub fn try_play(&mut self, cards: &[Card]) -> Result<bool, PlayError> {
        if !self.game.started {
            unimplemented!()
        }

        if self.game.current_player().id != self.id {
            return Err(PlayError::OutOfTurn);
        } else if cards.len() == 0 {
            return Err(PlayError::NoCards);
        } else if !self.has(&cards) {
            return Err(PlayError::InvalidCard);
        }

        let turn: Turn = cards.into();

        if self.game.new_pattern {
            if let Some(must_play) = self.game.mandatory_card {
                if cards[0] != must_play {
                    return Err(PlayError::MustPlayLowest);
                }
                self.game.mandatory_card = None;
            }

            if turn.pattern == Pattern::Invalid {
                return Err(PlayError::InvalidPattern);
            }
            self.game.history.push(turn);
            self.game.next_turn();
            self.game.new_pattern = false;
        } else {
            {
                let target = self.game.history.last().unwrap();

                match turn.pattern {
                    Pattern::Invalid => return Err(PlayError::InvalidPattern),
                    Pattern::Repeat(4)
                        if (target.pattern == Pattern::Repeat(1)
                            || target.pattern == Pattern::Repeat(2))
                            && target.top_card().vc_value() == 12 =>
                    { /* do nothing */ }
                    Pattern::SequencePair(n)
                        if target.pattern == Pattern::Repeat(n - 2)
                            && target.top_card().vc_value() == 12 =>
                    { /* do nothing */ }
                    p if p != target.pattern => return Err(PlayError::BadPattern),
                    _ if turn.top_card() > target.top_card() => { /* do nothing */ }
                    _ => return Err(PlayError::BadCard),
                };
            }

            self.game.history.push(turn);
            self.game.next_turn();
        }

        self.game.pass_count = 0;

        self.remove_cards(&cards);

        Ok(self.cards().len() == 0)
    }

    pub fn try_pass(&mut self) -> Result<(), PassError> {
        if !self.game.started {
            unimplemented!()
        }

        if self.game.current_player().id != self.id {
            return Err(PassError::OutOfTurn);
        }

        if self.game.new_pattern {
            return Err(PassError::MustPlay);
        }

        if let Some(_) = self.game.mandatory_card {
            return Err(PassError::MustPlayLowest);
        }

        self.game.next_turn();
        self.game.pass_count += 1;

        if self.game.pass_count >= self.game.players.len() - 1 {
            self.game.pass_count = 0;
            self.game.new_pattern = true;
        }

        Ok(())
    }
}

impl<'game> fmt::Debug for PlayerHandle<'game> {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "Player( cards: {:?} )", self.cards())
    }
}

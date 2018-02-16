use std::fmt;
use cards::Card;

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
    pub fn check_sequence_pair(source: &[Card]) -> bool {
        source.len() >= 6 && source.last().unwrap().vc_value() != 12
            && source
                .chunks(2)
                .all(|pair| pair[0].vc_value() == pair[1].vc_value())
            && Self::check_sequence(&source.iter().step_by(2).cloned().collect::<Vec<_>>())
    }

    /// Check for n-repeats.
    /// ie: [3, 3] of 1..4
    /// Can also represent single patterns
    pub fn check_sequence(source: &[Card]) -> bool {
        source.len() >= 3 && source.last().unwrap().vc_value() != 12
            && source
                .iter()
                .enumerate()
                .all(|(index, card)| card.vc_value() == source[0].vc_value() + index as u8)
    }

    /// Check for a sequence.
    /// ie: [3, 4, 5...] of a certain length >= 3
    pub fn check_repeat(source: &[Card]) -> bool {
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

pub enum TurnError {
    OutOfTurn,
    ForgedCards, // player tried to play cards that they don't have
    BadTurn,     // player tried to play on turn but it didn't work out
}

pub struct Game {
    started: bool, // has the game started

    new_round: bool,     // is it a new round? can you start a new pattern?
    pass_count: usize,   // how many people passed
    current_turn: usize, // whose turn is it currently

    players: Vec<Player>, // cards of the players of the game

    pub history: Vec<Turn>, // past turns
}

impl Game {
    pub fn new() -> Self {
        Game {
            started: false,
            new_round: true,
            pass_count: 0,
            current_turn: 0,
            players: Vec::new(),
            history: Vec::new(),
        }
    }

    // get an abstraction
    #[inline]
    pub fn player_controller(&mut self, local_id: usize) -> PlayerController {
        if local_id >= self.players.len() {
            unimplemented!()
        }

        PlayerController { game: self, local_id }
    }

    // add a new player and return their local id
    pub fn add_player(&mut self) -> usize {
        if self.started || self.players.len() >= 4 {
            unimplemented!()
        }

        self.players.push(Player { cards: Vec::new() });

        self.players.len() - 1
    }

    pub fn start(&mut self) {
        if self.started {
            unimplemented!()
        }

        use cards::partitioned_deck;
        let decks = partitioned_deck();

        for i in 0..self.players.len() {
            self.player_controller(i).add_cards(&decks[i]);
        }

        self.started = true;
    }

    fn next_turn(&mut self) {
        self.current_turn += 1;
        self.current_turn %= self.players.len();
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

    pub fn gt(&self, target: &Self) -> bool {
        match self.pattern {
            Pattern::Repeat(4) => {
                target.pattern == Pattern::Repeat(1) && target.top_card().vc_value() == 12
            }
            Pattern::SequencePair(n) => {
                target.pattern == Pattern::Repeat(n - 2) && target.top_card().vc_value() == 12
            }
            Pattern::Invalid => false,
            p => p == target.pattern && self.top_card() > target.top_card(),
        }
    }
}

pub struct Player {
    cards: Vec<Card>
}

pub struct PlayerController<'game> {
    game: &'game mut Game,
    local_id: usize,
}

// abstraction to make player handling easier
impl<'game> PlayerController<'game> {
    #[inline]
    pub fn cards(&self) -> &[Card] {
        &self.game.players[self.local_id].cards
    }

    #[inline]
    pub fn cards_mut(&mut self) -> &mut Vec<Card> {
        &mut self.game.players[self.local_id].cards
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

    pub fn play(&mut self, cards: Vec<Card>) -> Result<(), TurnError> {
        if !self.game.started {
            unimplemented!()
        }

        if self.game.current_turn != self.local_id {
            return Err(TurnError::OutOfTurn);
        } else if !self.has(&cards) {
            return Err(TurnError::ForgedCards);
        }

        let turn: Turn = cards.as_slice().into();

        if self.game.new_round {
            if turn.pattern == Pattern::Invalid {
                return Err(TurnError::BadTurn);
            }
            self.game.history.push(turn);
            self.game.next_turn();
            self.game.new_round = false;
        } else if turn.gt(self.game.history.last().unwrap()) {
            self.game.history.push(turn);
            self.game.next_turn();
        } else {
            return Err(TurnError::BadTurn);
        }

        self.remove_cards(&cards);

        Ok(())
    }

    pub fn pass(&mut self) -> Result<(), TurnError> {
        if !self.game.started {
            unimplemented!()
        }

        if self.game.current_turn != self.local_id {
            return Err(TurnError::OutOfTurn);
        }

        self.game.next_turn();
        self.game.pass_count += 1;

        if self.game.pass_count >= self.game.players.len() - 1 {
            self.game.pass_count = 0;
            self.game.new_round = true;
        }

        Ok(())
    }
}

impl<'game> fmt::Debug for PlayerController<'game> {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "Player( cards: {:?} )", self.cards())
    }
}
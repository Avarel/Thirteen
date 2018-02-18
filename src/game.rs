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

pub enum PlayError {
    NoCards,        // player tried to play nothing
    OutOfTurn,
    ForgedCards, // player tried to play cards that they don't have
    BadPlay,     // player tried to play on turn but it didn't work out
    MustPlayLowest,   // at the start of game, player must play their lowest card
}

pub enum PassError {
    OutOfTurn,
    MustPlay,        // the player can not pass this turn
    MustPlayLowest,  // the player must play on the first turn of the game
}

pub struct Game {
    started: bool, // has the game started

    new_pattern: bool,     // is it a new round? can you start a new pattern?
    pass_count: usize,   // how many people passed
    current_turn: usize, // whose turn is it currently
    mandatory_card: Option<Card>,

    players: Vec<Player>, // cards of the players of the game
    history: Vec<Turn>,   // past turns
}

impl Game {
    pub fn new() -> Self {
        Game {
            started: false,
            new_pattern: true,
            pass_count: 0,
            current_turn: 0,
            mandatory_card: None,
            players: Vec::new(),
            history: Vec::new(),
        }
    }

    // get an abstraction
    #[inline]
    pub fn player_handle(&mut self, local_id: usize) -> PlayerHandle {
        if local_id >= self.players.len() {
            unimplemented!()
        }

        PlayerHandle {
            game: self,
            local_id,
        }
    }

    #[inline]
    pub fn players(&self) -> &[Player] {
        &self.players
    }

    #[inline]
    pub fn current_turn(&self) -> usize {
        self.current_turn
    }

    #[inline]
    pub fn is_new_pattern(&self) -> bool {
        self.new_pattern
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
        if self.players.len() == 0 {
            unimplemented!()
        }

        use cards::partitioned_deck;
        let mut decks = partitioned_deck();

        for i in 0..self.players.len() {
            decks[i].sort();
            self.player_handle(i).add_cards(&decks[i]);
        }

        // find lowest turn and force the card
        let (current_turn, card) = self.players
            .iter()
            .enumerate()
            .min_by_key(|p| p.1.cards[0])
            .map(|e| (e.0, e.1.cards[0]))
            .unwrap();
        self.current_turn = current_turn;
        self.mandatory_card = Some(card);

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
    cards: Vec<Card>,
}

pub struct PlayerHandle<'game> {
    game: &'game mut Game,
    local_id: usize,
}

// abstraction to make player handling easier
impl<'game> PlayerHandle<'game> {
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

    // Ok(bool)
    //      true if the player won, false if the game continues
    // Err(TurnError)
    //      player made an game error
    pub fn try_play(&mut self, cards: &[Card]) -> Result<bool, PlayError> {
        if !self.game.started {
            unimplemented!()
        }

        if self.game.current_turn != self.local_id {
            return Err(PlayError::OutOfTurn);
        } else if cards.len() == 0 {
            return Err(PlayError::NoCards);
        } else if !self.has(&cards) {
            return Err(PlayError::ForgedCards);
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
                return Err(PlayError::BadPlay);
            }
            self.game.history.push(turn);
            self.game.next_turn();
            self.game.new_pattern = false;
        } else if turn.gt(self.game.history.last().unwrap()) {
            self.game.history.push(turn);
            self.game.next_turn();
        } else {
            return Err(PlayError::BadPlay);
        }

        self.remove_cards(&cards);

        Ok(self.cards().len() == 0)
    }

    pub fn try_pass(&mut self) -> Result<(), PassError> {
        if !self.game.started {
            unimplemented!()
        }

        if self.game.current_turn != self.local_id {
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

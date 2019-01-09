use super::game::{Action, CurrentTurn, Event, Game, GameState, PassError, PlayError};
use crate::cards::Card;
use std::collections::HashMap;
use uuid::Uuid;

use super::client::ClientHandler;
use super::Server;
use crate::data::{ErrorCode, PlayerData, Request, Response, SuccessCode};

pub struct Instance {
    pub id: Uuid,
    pub size: usize,
    server: *mut Server,

    game: Game,
    connections: HashMap<Uuid, *mut ClientHandler>,
}

impl Instance {
    pub fn new(size: usize, server: *mut Server) -> Self {
        let id = Uuid::new_v4();
        debug!("Creating a new instance (id: {}, size: {}).", id, size);
        Instance {
            id,
            size,
            server,
            game: Game::new(),
            connections: HashMap::with_capacity(size),
        }
    }

    pub fn destroy(self) {
        debug!(
            "Destroying instance (id: {}, size: {}).",
            self.id, self.size
        );
    }

    fn start(&mut self) {
        info!(
            "Instance (id: {}, size: {}) is starting.",
            self.id, self.size
        );

        self.game.start();

        println!("{:?}", self.server);

        let players: Vec<PlayerData> = self.game
            .players()
            .iter()
            .map(|p| PlayerData {
                id: p.id,
                name: p.name.clone(),
            })
            .collect();

        for p in &players {
            use crate::cards::Card;
            let your_cards = self.game
                .get_player(p.id)
                .unwrap()
                .cards
                .iter()
                .map(Card::into_id)
                .collect();

            self.get_client(p.id).send(&Response::READY {
                your_cards,
                players: players.clone(),
                cards_per_player: 13,
            });
        }

        self.broadcast_turn_change();
        unsafe { &mut *self.server }.upgrade_instance(self.id);
    }

    pub fn process(&mut self, cid: Uuid, data: Request) {
        if !self.game.ready() {
            return;
        }

        match data {
            Request::PLAY { card_ids } => {
                if let Err(err) = self.game.handle(Event {
                    player_id: cid,
                    action: Action::Play(
                        card_ids.iter().cloned().filter_map(Card::from_id).collect(),
                    ),
                }) {
                    self.get_client(cid).send(&Response::ERROR {
                        message: match err.play_error() {
                            PlayError::OutOfTurn => ErrorCode::OUT_OF_TURN,
                            PlayError::NoCards => ErrorCode::NO_CARDS,
                            PlayError::MustPlayLowest => ErrorCode::MUST_PLAY_LOWEST,
                            PlayError::InvalidCard => ErrorCode::INVALID_CARD,
                            PlayError::InvalidPattern => ErrorCode::INVALID_PATTERN,
                            PlayError::BadPattern => ErrorCode::BAD_PATTERN,
                            PlayError::BadCard => ErrorCode::BAD_CARD,
                        },
                    });
                } else {
                    self.get_client(cid).send(&Response::SUCCESS {
                        message: SuccessCode::PLAY,
                    });
                    self.broadcast(&Response::PLAY {
                        player_id: cid,
                        card_ids: card_ids,
                    });
                    self.broadcast_turn_change();
                }
            }
            Request::PASS => {
                if let Err(err) = self.game.handle(Event {
                    player_id: cid,
                    action: Action::Pass,
                }) {
                    self.get_client(cid).send(&Response::ERROR {
                        message: match err.pass_error() {
                            PassError::OutOfTurn => ErrorCode::OUT_OF_TURN,
                            PassError::MustPlay => ErrorCode::MUST_START_NEW_PATTERN,
                        },
                    });
                } else {
                    self.get_client(cid).send(&Response::SUCCESS {
                        message: SuccessCode::PASS,
                    });
                    self.broadcast_turn_change();
                }
            }
            _ => {}
        };
    }

    fn broadcast_turn_change(&self) {
        match self.game.state() {
            GameState::Ended { victor_id } => {
                self.broadcast(&Response::END {
                    victor_id: *victor_id,
                });
                unsafe { &mut *self.server }.remove_instance(self.id);
            }
            GameState::Ready {
                ref current_turn, ..
            } => match current_turn {
                CurrentTurn::FirstTurn { player_id, .. } => {
                    self.broadcast(&Response::TURN_CHANGE {
                        player_id: *player_id,
                        first_turn: true,
                        new_pattern: true,
                    });
                }
                CurrentTurn::NewTurn { player_id } => {
                    self.broadcast(&Response::TURN_CHANGE {
                        player_id: *player_id,
                        first_turn: false,
                        new_pattern: true,
                    });
                }
                CurrentTurn::NormalTurn { player_id } => {
                    self.broadcast(&Response::TURN_CHANGE {
                        player_id: *player_id,
                        first_turn: false,
                        new_pattern: false,
                    });
                }
                _ => unimplemented!("SecondTurn is not implemented yet"),
            },
            _ => {}
        }
    }

    pub fn add_client(&mut self, client: *mut ClientHandler, name: String) -> bool {
        if self.connections.len() >= self.size {
            return false;
        }

        let id = unsafe { &*client }.id;

        debug!(
            "Connecting client (id: {}) to instance (id: {}, size: {})",
            id, self.id, self.size
        );
        self.connections.insert(id, client);
        self.game.add_player(id, name);

        self.broadcast(&Response::QUEUE_UPDATE {
            size: self.connections.len(),
            goal: self.size,
        });

        if self.connections.len() == self.size {
            self.start();
        }
        true
    }

    pub fn get_client(&mut self, cid: Uuid) -> &mut ClientHandler {
        unsafe { &mut *self.connections[&cid] }
    }

    pub fn remove_client(&mut self, cid: Uuid, disconnect: bool) {
        let client = self.connections
            .remove(&cid)
            .expect("Tried to remove an invalid client");

        if self.game.ready() && self.connections.len() <= 1 {
            self.connections
                .values()
                .map(|c| unsafe { &**c })
                .for_each(|c| c.disconnect());
            unsafe { &mut *self.server }.remove_instance(self.id);
        }

        self.game.remove_player(cid);

        if self.game.ready() {
            self.broadcast_turn_change();
        } else {
            self.broadcast(&Response::QUEUE_UPDATE {
                size: self.connections.len(),
                goal: self.size,
            });
        }

        if disconnect {
            let temp = unsafe { &mut *client };
            temp.clear_instance();
            temp.disconnect();
        }
    }

    fn broadcast(&self, data: &Response) {
        self.connections
            .values()
            .map(|c| unsafe { &**c })
            .for_each(|c| c.send(data));
    }
}

impl Drop for Instance {
    fn drop(&mut self) {
        debug!("Dropping instance (id: {}).", self.id);
    }
}

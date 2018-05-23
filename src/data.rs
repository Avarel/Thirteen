use uuid::Uuid;

#[allow(non_camel_case_types)]
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct PlayerData {
	pub id: Uuid,
	pub name: String,
}

#[allow(non_camel_case_types)]
#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(tag = "type")]
pub enum Response {
	QUEUE_UPDATE {
		size: usize,
		goal: usize,
	},
	IDENTIFY {
		id: Uuid,
	},
	READY {
		your_cards: Vec<u8>,
		players: Vec<PlayerData>,
		cards_per_player: usize,
	},
	PLAY {
		player_id: Uuid,
		card_ids: Vec<u8>,
	},
	END {
		victor_id: Uuid,
	},
	TURN_CHANGE {
		player_id: Uuid,
		first_turn: bool,
		new_pattern: bool,
	},
	SUCCESS {
		message: SuccessCode,
	},
	ERROR {
		message: ErrorCode,
	},
}

#[allow(non_camel_case_types)]
#[derive(Serialize, Deserialize, Debug, Clone, Copy)]
pub enum SuccessCode {
	PASS,
	PLAY,
}

#[allow(non_camel_case_types)]
#[derive(Serialize, Deserialize, Debug, Clone, Copy)]
pub enum ErrorCode {
	OUT_OF_TURN,
	NO_CARDS,
	MUST_PLAY_LOWEST,
	MUST_START_NEW_PATTERN,
	INVALID_CARD,
	INVALID_PATTERN,
	BAD_CARD,
	BAD_PATTERN,
}

#[allow(non_camel_case_types)]
#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(tag = "type")]
pub enum Request {
	JOIN_GAME { name: String, game_size: usize },
	EXIT_GAME,
	PASS,
	PLAY { card_ids: Vec<u8> },
}

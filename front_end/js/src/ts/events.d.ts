declare namespace Client {
    interface QueueUpdate {
        type: "QUEUE_UPDATE",
        size: number,
        goal: number
    }
    interface Identify {
        type: "IDENTIFY",
        id: number
    }
    interface Ready {
        type: "READY",
        your_cards: number[],
        player_ids: number[],
        cards_per_player: number
    }
    interface Play {
        type: "PLAY",
        player_id: number,
        card_ids: number[]
    }
    interface End {
        type: "END",
        victor_id: number
    }
    interface PlaySuccess {
        type: "PLAY_SUCCESS"
    }
    interface PassSuccess {
        type: "PASS_SUCCESS"
    }
    interface TurnUpdate {
        type: "TURN_UPDATE"
        player_id: number,
        first_turn: boolean,
        must_play: boolean
    }
    interface Status {
        type: "STATUS",
        message: string
    }
    interface Error {
        type: "ERROR",
        reason: string
    }

    type Payload = QueueUpdate | Identify | Ready 
                | Play | End | PlaySuccess | PassSuccess 
                | TurnUpdate | Status | Error;            
}
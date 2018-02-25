namespace ThirteenAPI {
    interface IdentifyEvent {
        type: "IDENTIFY",
        id: number
    } 
    interface QueueUpdateEvent {
        type: "QUEUE_UPDATE",
        size: number,
        goal: number
    }
    interface ReadyEvent {
        type: "READY",
        your_cards: number[],
        player_ids: number[],
        cards_per_player: number
    }
    interface EndEvent {
        type: "END",
        victor_id: number
    }
    interface PlayEvent {
        type: "PLAY",
        player_id: number,
        card_ids: number[]
    } 
    interface TurnChangeEvent {
        type: "TURN_CHANGE"
        player_id: number,
        first_turn: boolean,
        must_play: boolean
    }
    interface SuccessEvent {
        type: "SUCCESS",
        message: "play" | "pass"
    }
    interface StatusEvent {
        type: "STATUS",
        message: string
    }
    interface ErrorEvent {
        type: "ERROR",
        message: string
    }
    export type PayloadIn = IdentifyEvent | QueueUpdateEvent | ReadyEvent 
            | PlayEvent | EndEvent | SuccessEvent
            | TurnChangeEvent | StatusEvent | ErrorEvent;

    interface Play {
        type: "PLAY",
        card_ids: number[]
    }
    interface Pass {
        type: "PASS"
    }
    export type PayloadOut = Play | Pass;

    export interface EventHandler {
        onConnect?(event: Event): void;
        onDisconnect?(event: Event): void;
        onIdentify?(event: IdentifyEvent): void;
        onQueueUpdate?(event: QueueUpdateEvent): void;
        onReady?(event: ReadyEvent): void;
        onEnd?(event: EndEvent): void;
        onPlay?(event: PlayEvent): void;
        onTurnChange?(event: TurnChangeEvent): void;
        onSuccess?(event: SuccessEvent): void;
        onError?(event: ErrorEvent): void;
        onStatus?(event: StatusEvent): void;
    }

    export class Client {
        readonly ws: WebSocket;
        id!: number;

        constructor(address: string, readonly handler: EventHandler) {
            console.log("Connecting to server...");

            this.ws = new WebSocket(address, "thirteen-game");
            this.ws.onopen = event => this.onConnect(event);
            this.ws.onclose = event => this.onDisconnect(event);
            this.ws.onmessage = event => this.onReceive(event);
        }

        send(data: PayloadOut): void {
            this.ws.send(JSON.stringify(data));
        }

        disconnect(): void {
            this.ws.close(1000);
        }

        onConnect(event: Event): void {
            if (this.handler.onConnect) this.handler.onConnect(event);
        }

        onDisconnect(event: Event): void {
            if (this.handler.onDisconnect) this.handler.onDisconnect(event);
        }

        onReceive(event: MessageEvent): void {
            let handler = this.handler;
            if (handler == undefined) {
                return;
            }

            let payload = JSON.parse(event.data) as PayloadIn;

            switch (payload.type) {
                case "IDENTIFY":
                    this.id = payload.id;
                    if (handler.onIdentify) handler.onIdentify(payload);
                    break;
                case "QUEUE_UPDATE":
                    if (handler.onQueueUpdate) handler.onQueueUpdate(payload);
                    break;
                case "READY": 
                    if (handler.onReady) handler.onReady(payload);
                    break;
                case "END":
                    if (handler.onEnd) handler.onEnd(payload);
                    break;
                case "PLAY": 
                    if (handler.onPlay) handler.onPlay(payload);
                    break;
                case "TURN_CHANGE": 
                    if (handler.onTurnChange) handler.onTurnChange(payload);
                    break;
                case "SUCCESS":
                    if (handler.onSuccess) handler.onSuccess(payload);
                    break;
                case "ERROR":
                    if (handler.onError) handler.onError(payload);
                    break;
                case "STATUS":
                    if (handler.onStatus) handler.onStatus(payload);
                    break;
            }
        }
    }
}
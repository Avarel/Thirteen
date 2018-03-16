namespace ThirteenAPI {
    export interface IdentifyEvent {
        type: "IDENTIFY",
        id: number
    }
    export interface QueueUpdateEvent {
        type: "QUEUE_UPDATE",
        size: number,
        goal: number
    }
    export interface ReadyEvent {
        type: "READY",
        your_cards: number[],
        player_ids: number[],
        cards_per_player: number
    }
    export interface EndEvent {
        type: "END",
        victor_id: number
    }
    export interface PlayEvent {
        type: "PLAY",
        player_id: number,
        card_ids: number[]
    }
    export interface TurnChangeEvent {
        type: "TURN_CHANGE"
        player_id: number,
        first_turn: boolean,
        new_pattern: boolean
    }
    export interface SuccessEvent {
        type: "SUCCESS",
        message: "PLAY" | "PASS"
    }
    export interface StatusEvent {
        type: "STATUS",
        message: string
    }
    export interface ErrorEvent {
        type: "ERROR",
        message: string
    }
    export type PayloadIn = IdentifyEvent | QueueUpdateEvent | ReadyEvent
        | PlayEvent | EndEvent | SuccessEvent
        | TurnChangeEvent | StatusEvent | ErrorEvent;

    export interface Play {
        type: "PLAY",
        card_ids: number[]
    }
    export interface Pass {
        type: "PASS"
    }
    export type PayloadOut = Play | Pass;

    export interface EventHandler {
        onConnect?(this: Client, event: Event): void;
        onDisconnect?(this: Client, event: Event): void;
        onIdentify?(this: Client, event: IdentifyEvent): void;
        onQueueUpdate?(this: Client, event: QueueUpdateEvent): void;
        onReady?(this: Client, event: ReadyEvent): void;
        onEnd?(this: Client, event: EndEvent): void;
        onPlay?(this: Client, event: PlayEvent): void;
        onTurnChange?(this: Client, event: TurnChangeEvent): void;
        onSuccess?(this: Client, event: SuccessEvent): void;
        onError?(this: Client, event: ErrorEvent): void;
        onStatus?(this: Client, event: StatusEvent): void;
    }

    export class Client {
        readonly ws: WebSocket;
        waiter?: Map<PayloadIn["type"], ((event: PayloadIn) => void)[]>;
        id!: number;

        constructor(address: string, readonly handler: EventHandler) {
            console.log("Connecting to server...");

            this.ws = new WebSocket(address, "thirteen-game");
            this.ws.onopen = event => { if (this.handler.onConnect) this.handler.onConnect.call(this, event) };
            this.ws.onclose = event => { if (this.handler.onDisconnect) this.handler.onDisconnect.call(this, event) };
            this.ws.onmessage = event => this.onReceive(event);
        }

        send(data: PayloadOut): void {
            this.ws.send(JSON.stringify(data));
        }

        disconnect(): void {
            this.ws.close(1000);
        }

        waitFor<T extends PayloadIn, K extends T["type"]>(type: K, callback: (event: T) => void) {
            let waiter = this.waiter ? this.waiter : this.waiter = new Map();
            let list = waiter.get(type);
            if (!list) {
                list = [];
                waiter.set(type, list);
            }
            list.push(callback as (event: PayloadIn) => void);
        }

        onReceive(event: MessageEvent): void {
            let handler = this.handler;
            if (handler == undefined) {
                return;
            }

            let payload = JSON.parse(event.data) as PayloadIn;

            if (this.waiter) {
                let callbacks = this.waiter.get(payload.type);
                if (callbacks) {
                    callbacks.forEach(it => it(payload));
                    this.waiter.delete(payload.type);
                }
            }

            switch (payload.type) {
                case "IDENTIFY":
                    this.id = payload.id;
                    if (handler.onIdentify) handler.onIdentify.call(this, payload);
                    break;
                case "QUEUE_UPDATE":
                    if (handler.onQueueUpdate) handler.onQueueUpdate.call(this, payload);
                    break;
                case "READY":
                    if (handler.onReady) handler.onReady.call(this, payload);
                    break;
                case "END":
                    if (handler.onEnd) handler.onEnd.call(this, payload);
                    break;
                case "PLAY":
                    if (handler.onPlay) handler.onPlay.call(this, payload);
                    break;
                case "TURN_CHANGE":
                    if (handler.onTurnChange) handler.onTurnChange.call(this, payload);
                    break;
                case "SUCCESS":
                    if (handler.onSuccess) handler.onSuccess.call(this, payload);
                    break;
                case "ERROR":
                    if (handler.onError) handler.onError.call(this, payload);
                    break;
                case "STATUS":
                    if (handler.onStatus) handler.onStatus.call(this, payload);
                    break;
            }
        }
    }
}
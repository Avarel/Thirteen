namespace ThirteenAPI {
    export type UUID = string;

    export interface IdentifyEvent {
        type: 'IDENTIFY',
        id: UUID
    }
    export interface QueueUpdateEvent {
        type: 'QUEUE_UPDATE',
        size: number,
        goal: number
    }
    export interface ReadyEvent {
        type: 'READY',
        your_cards: number[],
        players: { id: UUID, name: string }[],
        cards_per_player: number
    }
    export interface EndEvent {
        type: 'END',
        victor_id: UUID
    }
    export interface PlayEvent {
        type: 'PLAY',
        player_id: UUID,
        card_ids: number[]
    }
    export interface TurnChangeEvent {
        type: 'TURN_CHANGE'
        player_id: UUID,
        first_turn: boolean,
        new_pattern: boolean
    }
    export interface SuccessEvent {
        type: 'SUCCESS',
        message: 'PLAY' | 'PASS'
    }
    export interface StatusEvent {
        type: 'STATUS',
        message: string
    }
    export interface ErrorEvent {
        type: 'ERROR',
        message: 'OUT_OF_TURN' | 'NO_CARDS' | 'MUST_PLAY_LOWEST' | 'MUST_START_NEW_PATTERN' | 'INVALID_CARD' | 'INVALID_PATTERN' | 'BAD_CARD' | 'BAD_PATTERN'
    }
    export type PayloadIn = IdentifyEvent | QueueUpdateEvent | ReadyEvent
        | PlayEvent | EndEvent | SuccessEvent
        | TurnChangeEvent | StatusEvent | ErrorEvent;

    export interface JoinGame {
        type: 'JOIN_GAME',
        name: string,
        game_size: number,
    }
    export interface ExitGame {
        type: 'EXIT_GAME'
    }
    export interface Play {
        type: 'PLAY',
        card_ids: number[]
    }
    export interface Pass {
        type: 'PASS'
    }

    export type PayloadOut = JoinGame | ExitGame | Play | Pass;

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
        id!: UUID;

        constructor(address: string, readonly handler: EventHandler) {
            console.log('Connecting to server...');

            this.ws = new WebSocket(address, 'thirteen-game');
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

        onReceive(event: MessageEvent): void {
            let handler = this.handler;
            if (handler == undefined) {
                return;
            }

            let payload = JSON.parse(event.data) as PayloadIn;

            switch (payload.type) {
                case 'IDENTIFY':
                    this.id = payload.id;
                    if (handler.onIdentify) handler.onIdentify.call(this, payload);
                    break;
                case 'QUEUE_UPDATE':
                    if (handler.onQueueUpdate) handler.onQueueUpdate.call(this, payload);
                    break;
                case 'READY':
                    if (handler.onReady) handler.onReady.call(this, payload);
                    break;
                case 'END':
                    if (handler.onEnd) handler.onEnd.call(this, payload);
                    break;
                case 'PLAY':
                    if (handler.onPlay) handler.onPlay.call(this, payload);
                    break;
                case 'TURN_CHANGE':
                    if (handler.onTurnChange) handler.onTurnChange.call(this, payload);
                    break;
                case 'SUCCESS':
                    if (handler.onSuccess) handler.onSuccess.call(this, payload);
                    break;
                case 'ERROR':
                    if (handler.onError) handler.onError.call(this, payload);
                    break;
                case 'STATUS':
                    if (handler.onStatus) handler.onStatus.call(this, payload);
                    break;
            }
        }
    }
}
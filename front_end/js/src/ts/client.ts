cards.init({ table: '.game' });

namespace Thirteen {
    export let connection: Client | undefined = undefined;

    export class Client {
        readonly ws: WebSocket;
        id!: number;

        constructor(address: string) {
            console.log("Connecting to server...");

            this.ws = new WebSocket(address, "thirteen-game");
            this.ws.onopen = event => this.onConnect(event);
            this.ws.onclose = () => this.onDisconnect();
            this.ws.onmessage = event => this.onReceive(event);
        }

        send(data: ThirteenAPI.PayloadOut): void {
            this.ws.send(JSON.stringify(data));
        }

        disconnect(): void {
            this.ws.close(1000);
            connection = undefined;
        }

        onConnect(event: Event): void {
            console.log("Connected to server.");
            $("#connect").text("Disconnect");
            $("#connect").removeClass("disabled");
        }

        onDisconnect(): void {
            console.log("Disconnected from server.");
            $("#connect").text("Connect");
            $("#connect").removeClass("disabled");

            Display.reset();
        }

        onReceive(event: MessageEvent): void {
            let payload = JSON.parse(event.data) as ThirteenAPI.PayloadIn;

            switch (payload.type) {
                case "QUEUE_UPDATE":
                    Display.updateStatus(`${payload.size}/${payload.goal} connected players!`);
                    break;
                case "IDENTIFY":
                    this.id = payload.id;
                    break;
                case "READY": 
                    Display.start(payload.your_cards, payload.player_ids, payload.cards_per_player);
                    break;
                case "STATUS":
                    Display.updateStatus(payload.message);
                    break;
                case "ERROR":
                    Display.updateStatus(payload.message);
                    break;
                case "PLAY": 
                    Display.play(payload.player_id, payload.card_ids);
                    break;
                case "TURN_CHANGE": {
                    Display.playerSlots.forEach(c => c.tag.hide());
                    Display.playerSlots[Display.asDisplayID(payload.player_id)].tag.show();

                    if (payload.player_id == this.id) {
                        Display.playButton(true);
                        Display.passButton(!payload.must_play);

                        if (payload.first_turn) {
                            Display.updateStatus("You got the first turn!");
                        } else {
                            Display.updateStatus("It is your turn!");
                        }                        
                    } else {
                        Display.playButton(false);
                        Display.passButton(false);
                    }

                    break;
                }
                case "SUCCESS":
                    if (payload.message == "play") {
                        Display.updateStatus("You successfully played this turn!");
                    } else {
                        Display.updateStatus("You passed for this turn!");
                    }
                    break;
                case "END":
                    if (payload.victor_id == this.id) {
                        Display.updateStatus("You won!");
                    } else {
                        Display.updateStatus("You lost!");
                    }
                    setTimeout(() => this.disconnect(), 5000);
                    break;
            }
        }
    }

    namespace Display {
        import Card = cards.Card;
        import Deck = cards.Deck;
        import Hand = cards.Hand;
        import Anchor = cards.Anchor;

        export let playerIDs: number[] = [];

        function transmuteCards(ids: number[], cards: Card[]): Card[] {
            if (ids.length != cards.length) {
                throw new Error("cards and ids are not the same length");
            }
            for (let i = 0; i < cards.length; i++) {
                cards[i].id = ids[i];
            }
            return cards;
        }

        class DeckRepository {
            readonly cards: Card[] = [];
            readonly deck: Deck = new Deck();

            constructor(n: number) {
                for (let i = 0; i < n; i++) {
                    this.cards.push(new Card(0));
                }
                this.deck.addCards(...this.cards);
            }

            reset(): void {
                this.deck.array.forEach(c => c.id = 0);
                this.deck.clear();
                this.deck.addCards(...this.cards);
            }

            get(n: number): Card {
                return this.deck.array[n];
            }
        }

        class PlayerSlot {
            readonly tag: JQuery<HTMLElement>;
            readonly hand: Hand;

            constructor(readonly id: number) {
                this.tag = $($('.name-tag')[id]);
                switch (id) {
                    case 0:
                        this.hand = new Hand({ position: new Anchor({ bottom: 25 }), angle: 0 });
                        break;
                    case 1:
                        this.hand = new Hand({ position: new Anchor({ top: 0 }), angle: 180 });
                        break;
                    case 2:
                        this.hand = new Hand({ position: new Anchor({ left: 0 }), angle: 90 });
                        break;
                    case 3:
                        this.hand = new Hand({ position: new Anchor({ right: 0 }), angle: 270 });
                        break;
                    default:
                        throw new Error('Something happened while loading...');
                }
            }

            set name(name: string) {
                this.tag.text(name);
            }

            clear() {
                this.hand.clear();
            }

            reset() {
                this.tag.hide();
                this.hand.clear();
            }
        }

        const drepo = new DeckRepository(52);
        const discardPile = new Hand({ faceUp: true });

        export const playerSlots: PlayerSlot[] = [];
        for (let i = 0; i < 4; i++) {
            playerSlots.push(new PlayerSlot(i));
        }

        const me = { 
            hand: playerSlots[0].hand,
            queue: new Hand({ faceUp: true, position: new Anchor({ bottom: 125 }) })
        };

        export function reset() {
            $('#play').hide();
            $('#pass').hide();

            drepo.reset();
            drepo.deck.show();
            playerSlots.forEach(p => p.reset);

            renderAll({ speed: 2000, callback: () => drepo.deck.show() });

            updateStatus("Press Start Game to connect to the server!");
        }

        export function asDisplayID(targetID: number): number {
            for (let i = 0; i < playerIDs.length; i++) {
                if (playerIDs[i] == targetID) {
                    return i;
                }
            }
            throw Error("Invalid id");
        }

        function renderAll(options?: cards.RenderOptions) {
            drepo.deck.render(options);
            me.hand.render(options);
            me.queue.render(options);
            discardPile.render(options);
            playerSlots.forEach(h => h.hand.render(options));
        }

        export function start(myCards: number[], plIDs: number[], cardsPerPlayer: number): void {
            playerIDs = utils.rotate(plIDs, connection!.id);
            drepo.deck.deal(cardsPerPlayer, playerSlots.slice(0, plIDs.length).map(s => s.hand), 50, () => {
                transmuteCards(myCards, me.hand.array);
                me.hand.face(true);
                drepo.deck.hide();
                renderAll();
            });
        }

        export function play(playerID: number, cardIDs: number[]) {
            if (!connection) return;

            drepo.deck.addCards(...discardPile.array);
            discardPile.clear();

            let cards: Card[];

            if (playerID == connection.id) {
                cards = me.queue.array.splice(0, me.queue.array.length);
            } else {
                cards = playerSlots[asDisplayID(playerID)].hand.draw(cardIDs.length);
                transmuteCards(cardIDs, cards);
            }

            discardPile.addCards(...cards);
            renderAll();
        }

        export function playButton(on: boolean): void {
            if (on) {
                $('#play').show();
            } else {
                $('#play').hide();
            }
        }

        export function passButton(on: boolean): void {
            if (on) {
                $('#pass').show();
            } else {
                $('#pass').hide();
            }
        }

        export function updateStatus(msg: string): void {
            $(".status .text").text(msg);
        }

        $('#pass').click(() => {
            if (connection) {
                connection.send({ type: "PASS" });
            }
        });

        $('#play').click(() => {
            if (connection) {
                connection.send({ type: "PLAY", card_ids: me.queue.array.map(c => c.id) });
            }
        });

        me.hand.click(card => {
            me.queue.addCards(card);
            me.queue.render();
            me.hand.render();
        });

        me.queue.click(card => {
            me.hand.addCards(card);
            me.hand.render();
            me.queue.render();
        });

        $(window).resize(utils.debounce(() => renderAll({ speed: 0 }), 500));
        reset();
    }
}

$("#connect").click(() => {
    if ($("#connect").text() == "Connect" && !Thirteen.connection) {
        Thirteen.connection = new Thirteen.Client("ws://127.0.0.1:2794");
        $("#connect").text("Disconnect");
    } else if (Thirteen.connection) {
        Thirteen.connection.disconnect();
        $("#connect").text("Connect");
    }
})
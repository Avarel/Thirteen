cards.init({ table: '.game' });

namespace Thirteen {
    export let connection: Client | undefined = undefined;

    export class Client {
        readonly ws: WebSocket;
        id!: number;

        constructor(address: string) {
            console.log("Connecting to server...");

            this.ws = new WebSocket(address, "thirteen-game");
            this.ws.onopen = this.onConnect;
            this.ws.onclose = this.onDisconnect;
            this.ws.onmessage = this.onReceive;
        }

        send(data: any): void {
            this.ws.send(JSON.stringify(data));
        }

        disconnect(): void {
            this.ws.close(1000);
            connection = undefined;
        }

        onConnect(): void {
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
            let payload = JSON.parse(event.data);

            switch (Object.keys(payload)[0]) {
                case "QueueUpdate":
                    Display.updateStatus(`${payload.QueueUpdate.size}/${payload.QueueUpdate.goal} connected players!`);
                    break;
                case "Start":
                    let event = payload.Start;
                    this.id = event.your_id;
                    Display.start(event.your_cards, event.player_count, event.cards_per_player);
                    break;
                // case "Status":
                //     Game.status(payload.Status.message);
                //     break;
                // case "Error":
                //     Game.status(payload.Error.reason);
                //     break;
                // case "Discard":
                //     Game.discard(utils.cardsFromID(...payload.Discard.card_ids));
                //     break;
                // case "TurnUpdate": {
                //     let event: any = payload.TurnUpdate;
                //     Game.startTurn(event.player_id, event.first_turn, event.must_play);
                //     break;
                // }
                // case "PlaySuccess":
                //     Game.status("Great play!");
                //     break;
                // case "PassSuccess":
                //     Game.status("You passed for this turn!");
                //     break;
                // case "GameEnd":
                //     if (payload.GameEnd.victor_id == Thirteen.Game.myID) {
                //         Game.status("You won!");
                //     } else {
                //         Game.status("You lost!");
                //     }
                //     setTimeout(Thirteen.Client.disconnect, 5000);
                //     break;
            }
        }
    }
    

    export namespace Display {
        import Card = cards.Card;
        import Deck = cards.Deck;
        import Hand = cards.Hand;
        import Anchor = cards.Anchor;

        function coerceCards(ids: number[], cards: Card[]): Card[] {
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

        export const drepo = new DeckRepository(52);

        const playerSlots: PlayerSlot[] = [];
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

            renderAll({ speed: 2000, callback: () => drepo.deck.show() });

            updateStatus("Press Start Game to connect to the server!");
        }

        function renderAll(options?: cards.RenderOptions) {
            drepo.deck.render(options);
            me.hand.render(options);
            me.queue.render(options);
        }

        export function start(myCards: number[], playerCount: number, cardsPerPlayer: number): void {
            drepo.deck.deal(cardsPerPlayer, playerSlots.slice(0, playerCount).map(s => s.hand), 10, () => {
                coerceCards(myCards, me.hand.array);
                me.hand.face(true);
                drepo.deck.hide();
                renderAll();
            });
        }

        function turnUpdate(myTurn: boolean, mustPlay: boolean): void {
            if (myTurn) {
                $('#play').show();
                if (!mustPlay) { 
                    $('#pass').show();
                }
            } else {
                $('#play').hide();
                $('#pass').hide();
            }
        }

        export function updateStatus(msg: string): void {
            $(".status .text").text(msg);
        }

        $('#pass').click(() => {
            if (connection) {
                connection.send({ Pass: {} });
            }
        });

        $('#play').click(() => {
            if (connection) {
                connection.send({ Play: { ids: me.queue.array.map(c => c.id) } });
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

        $(window).resize(utils.debounce(() => renderAll({ immediate: true }), 500));
        reset();
    }

    // export namespace Client {
    //     let connection: WebSocket | undefined;

    //     export function connect() {
    //         if (connection) {
    //             log("Already connected to server!");
    //             return;
    //         }

    //         log("Connecting to server...");
    //         connection = new WebSocket("ws://127.0.0.1:2794", "thirteen-game");
    //         connection.onmessage = event => process(event);
    //         connection.onclose = () => { 
    //             disconnect();
    //             $("#connect").text("Connect");
    //             $("#connect").removeClass("disabled");
    //         };

    //         connection.onopen = () => {
    //             log("Connected to server.");
    //             $("#connect").text("Disconnect");
    //             $("#connect").removeClass("disabled");
    //         };
    //     }

    //     export function disconnect() {
    //         if (!connection) {
    //             log("You're not connected to the server!");
    //             return;
    //         }

    //         log("Disconnecting from server.");
    //         Game.status("Press Start Game to connect to the server!");
    //         Game.reset();
    //         connection.onclose = () => {
    //             log("Disconnected from server.");
    //             $("#connect").text("Connect");
    //             $("#connect").removeClass("disabled");
    //         };
    //         connection.close(1000);
    //         connection = undefined;
    //     }

    //     export function send(data: any) {
    //         if (!connection) {
    //             log("Tried to send something but not connected.");
    //             return;
    //         }
    //         connection.send(JSON.stringify(data));
    //     }

    //     export function log(msg: string) {
    //         console.log(msg);
    //         // let received = $("#received");

    //         // let text = document.createTextNode(msg);
    //         // let br = document.createElement("br");
    //         // received.append(text, br);

    //         // received.scrollTop(received.prop("scrollHeight"));
    //     }

    //     function process(event: MessageEvent) {
    //         let payload = JSON.parse(event.data);

    //         switch (Object.keys(payload)[0]) {
    //             case "QueueUpdate":
    //                 Game.status(`${payload.QueueUpdate.size}/${payload.QueueUpdate.goal} connected players!`);
    //                 break;
    //             case "Start":
    //                 Game.start(payload.Start.your_id, (payload.Start.card_ids as number[][]).map(ids => utils.cardsFromID(...ids)));
    //                 break;
    //             case "Status":
    //                 Game.status(payload.Status.message);
    //                 break;
    //             case "Error":
    //                 Game.status(payload.Error.reason);
    //                 break;
    //             case "Discard":
    //                 Game.discard(utils.cardsFromID(...payload.Discard.card_ids));
    //                 break;
    //             case "TurnUpdate": {
    //                 let event: any = payload.TurnUpdate;
    //                 Game.startTurn(event.player_id, event.first_turn, event.must_play);
    //                 break;
    //             }
    //             case "PlaySuccess":
    //                 Game.status("Great play!");
    //                 break;
    //             case "PassSuccess":
    //                 Game.status("You passed for this turn!");
    //                 break;
    //             case "GameEnd":
    //                 if (payload.GameEnd.victor_id == Thirteen.Game.myID) {
    //                     Game.status("You won!");
    //                 } else {
    //                     Game.status("You lost!");
    //                 }
    //                 setTimeout(Thirteen.Client.disconnect, 5000);
    //                 break;
    //         }
    //     }
    // }

    // export namespace Game {
    //     import Card = cards.Card;
    //     import Deck = cards.Deck;
    //     import Hand = cards.Hand;
    //     import Anchor = cards.Anchor;

    //     let nameTags = $('.name-tag');

    //     let displayOpts: cards.ContainerOptions[] = [
    //         { faceUp: true, position: new Anchor({ bottom: 25 }), angle: 0 },
    //         { faceUp: false, position: new Anchor({ top: 0 }), angle: 180 },
    //         { faceUp: false, position: new Anchor({ left: 0 }), angle: 90 },
    //         { faceUp: false, position: new Anchor({ right: 0 }), angle: 270 }
    //     ];

    //     export let dealDeck = new Deck();
    //     export let discardHand = new Hand({ faceUp: true });
    //     export let playerHands: Hand[];

    //     export let myID: number | undefined;
    //     export let myQueue = new Hand({ faceUp: true, position: new Anchor({ bottom: 125 }), angle: 0 });
    //     export let myHand: Hand;

    //     export function reset() {
    //         $('#play').hide();
    //         $('#pass').hide();

    //         myID = undefined;
    //         nameTags.hide();
    //         playerHands = [];

    //         dealDeck.addCards(...cards.all);

    //         status("Press Start Game to connect to the server!");

    //         renderAll({ speed: 2000, callback: () => dealDeck.show() });
    //     }

    //     export function start(id: number, cards: Card[][]) {
    //         myID = id;

    //         playerHands = displayOpts.slice(0, cards.length).map(opt => new Hand(opt));

    //         for (let [i, d] of utils.rotate(cards, id).entries()) {
    //             playerHands[i].addCards(...d);
    //             playerHands[i].render({ speed: 2000 });
    //         }
    //         myHand = playerHands[0];

    //         dealDeck.hide();

    //         for (let i = 0; i < cards.length; i++) {
    //             $(nameTags[i]).show();
    //         }

    //         $('#pass').click(() => {
    //             Client.send({ Pass: {} });
    //         });

    //         $('#play').click(() => {
    //             Client.send({ Play: { ids: myQueue.array.map(c => c.id) } });
    //         });

    //         playerHands[0].click(card => {
    //             myQueue.addCards(card);
    //             myQueue.render();
    //             myHand.render();
    //         });

    //         myQueue.click(card => {
    //             myHand.addCards(card);
    //             myHand.render();
    //             myQueue.render();
    //         });

    //         Game.status("The game has started! Wait for your turn!");
    //     }

    //     export function discard(cards: Card[]) {
    //         dealDeck.addCards(...discardHand.array);
    //         discardHand.addCards(...cards);
    //         renderAll();
    //     }

    //     export function startTurn(player_id: number, firstTurn: boolean, mustPlay: boolean) {
    //         if (player_id != myID) {
    //             Game.endTurn();
    //             return;
    //         }

    //         Game.status("It is your turn!");

    //         $('#play').show();

    //         if (!mustPlay) {
    //             $('#pass').show();
    //         }
    //     }

    //     export function endTurn() {
    //         $('#play').hide();
    //         $('#pass').hide();
    //     }

    //     // TODO imlement duration
    //     export function status(msg: string, duration?: number) {
    //         $(".status .text").text(msg);
    //     }

    //     function renderAll(options?: cards.RenderOptions) {
    //         dealDeck.render(options);
    //         discardHand.render(options);
    //         playerHands.forEach(x => x.render(options));
    //         myQueue.render(options);
    //     }

    //     $(window).resize(utils.debounce(() => renderAll({ immediate: true }), 500));
    // }
    
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
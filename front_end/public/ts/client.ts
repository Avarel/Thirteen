import { render } from "../../node_modules/@types/node-sass/index";

CardsJS.init({ table: '.game' });

namespace Thirteen {
    export let connection: ThirteenAPI.Client | undefined = undefined;

    import Card = CardsJS.Card;
    import Deck = CardsJS.Deck;
    import Hand = CardsJS.Hand;
    import Anchor = CardsJS.Anchor;

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

    namespace DealPile {
        const cards: Card[] = [];
        export const deck: Deck = new Deck();

        export function reset(): void {
            deck.array.forEach(c => c.id = 0);
            deck.clear();
            deck.addCards(...cards);
        }

        function init(n: number) {
            for (let i = 0; i < n; i++) {
                cards.push(new Card(0));
            }
            deck.addCards(...cards);
        }
        init(52);
    }

    namespace Players {
        class Slot {
            readonly tag: HTMLElement;
            readonly hand: Hand;

            constructor(readonly id: number) {
                this.tag = document.querySelectorAll<HTMLElement>('.name-tag')[id];
                switch (id) {
                    case 0:
                        this.hand = new Hand({ position: new Anchor({ bottom: 25 }), angle: 0, zIndex: 5 });
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
                this.tag.innerText = name;
            }

            showTag(on: boolean) {
                this.tag.style.display = on ? 'block' : 'none';
            }

            clear() {
                this.hand.clear();
            }

            reset() {
                this.showTag(false);
                this.hand.clear();
                this.hand.face(false);
            }
        }

        export const slots: Slot[] = [];
        for (let i = 0; i < 4; i++) {
            slots.push(new Slot(i));
        }

        export const self = {
            hand: slots[0].hand,
            queue: new Hand({ faceUp: true, position: new Anchor({ bottom: 100 }) })
        };
    }

    namespace History {
        export const slots: Hand[] = [];

        for (let i = 0; i < 3; i++) {
            slots.push(new Hand({ faceUp: true, position: new Anchor({ cx: 0, cy: 10 - i * 20 }), zIndex: 5 - i }));
        }
    }

    export function reset() {
        showPlay(false);
        showPass(false);

        DealPile.reset();
        DealPile.deck.show();
        Players.slots.forEach(p => p.reset());
        History.slots.forEach(h => h.clear());

        renderAll({ speed: 2000, callback: () => DealPile.deck.show() });

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

    function renderAll(options?: CardsJS.RenderOptions) {
        DealPile.deck.render(options);
        Players.self.hand.render(options);
        Players.self.queue.render(options);
        History.slots.forEach(h => h.render(options));
        Players.slots.forEach(h => h.hand.render(options));
    }

    const playButton = document.querySelector<HTMLElement>("#play")!;
    const passButton = document.querySelector<HTMLElement>("#pass")!;

    export function showPlay(on: boolean): void {
        console.log("Show play ", on);
        playButton.style.display = on ? 'block' : 'none';
    }

    export function showPass(on: boolean): void {
        passButton.style.display = on ? 'block' : 'none';
    }

    export function updateStatus(msg: string): void {
        document.querySelector<HTMLElement>(".status .text")!.innerText = msg;
    }

    Players.self.hand.click(card => {
        Players.self.queue.addCards(card);
        Players.self.queue.render();
        Players.self.hand.render();
    });

    Players.self.queue.click(card => {
        Players.self.hand.addCards(card);
        Players.self.hand.render();
        Players.self.queue.render();
    });

    passButton.onclick = () => {
        if (connection) {
            connection.send({ type: "PASS" });
        }
    };

    playButton.onclick = () => {
        if (connection) {
            connection.send({ type: "PLAY", card_ids: Players.self.queue.array.map(c => c.id) });
        }
    };

    window.onresize = utils.debounce(() => renderAll({ speed: 0 }), 500);
    reset();

    export let handler: ThirteenAPI.EventHandler = {
        onConnect(event: Event) {
            console.log("Connected to server.");
            Header.connectBtn.innerText = "Disconnect";
        },
        onDisconnect(event: Event) {
            console.log("Disconnected from server.");
            Header.connectBtn.innerText = "Connect";
            connection = undefined;
            reset();
        },
        onQueueUpdate(event: ThirteenAPI.QueueUpdateEvent) {
            updateStatus(`${event.size}/${event.goal} connected players!`);
        },
        onReady(event: ThirteenAPI.ReadyEvent) {
            playerIDs = utils.rotate(event.player_ids.slice(0), event.player_ids.indexOf(connection!.id));
            DealPile.deck.deal(event.cards_per_player, Players.slots.slice(0, playerIDs.length).map(s => s.hand), 50, () => {
                transmuteCards(event.your_cards, Players.self.hand.array);
                Players.self.hand.face(true);
                DealPile.deck.hide();
                renderAll();
            });
        },
        onStatus(event: ThirteenAPI.StatusEvent) {
            updateStatus(event.message);
        },
        onError(event: ThirteenAPI.ErrorEvent) {
            switch (event.message) {
                case "INVALID_CARD": 
                    updateStatus("Invalid cards. (Client sent invalid ids)");
                    break;
                case "INVALID_PATTERN":
                    updateStatus("Your pattern is not valid.");
                    break;
                case "BAD_PATTERN":
                    updateStatus("Your pattern does not match the pile's pattern.");
                    break;
                case "BAD_CARD":
                    updateStatus("Your hand's highest must be higher than the pile's highest card.");
                    break;
                case "OUT_OF_TURN":
                    updateStatus("It's not your turn right now! Wait a bit.");
                    break;
                case "MUST_START_NEW_PATTERN":
                    updateStatus("You must start a new pattern.");
                    break;
                case "NO_CARDS":
                    updateStatus("You can't play nothing.");
                    break;
                case "MUST_PLAY_LOWEST":
                    updateStatus("You must play your lowest card for this turn.");
                    break;
            }
        },
        onPlay(event: ThirteenAPI.PlayEvent) {
            if (!connection) return;

            let cards: Card[];

            if (event.player_id == connection.id) {
                cards = Players.self.queue.array.splice(0, Players.self.queue.array.length);
            } else {
                cards = Players.slots[asDisplayID(event.player_id)].hand.draw(event.card_ids.length, true);
                transmuteCards(event.card_ids, cards);
            }

            DealPile.deck.addCards(...History.slots[History.slots.length - 1].array.splice(0));

            for (let i = History.slots.length - 1; i > 0; i--) {
                History.slots[i].addCards(...History.slots[i - 1].array.splice(0));
            }

            History.slots[0].addCards(...cards);

            renderAll({ speed: 300 });
        },
        onSuccess(event: ThirteenAPI.SuccessEvent) {
            switch (event.message) {
                case "PLAY": 
                    updateStatus("You successfully played this round.");
                    break;
                case "PASS":
                    updateStatus("You passed for this round.");
                    break;
            }
        },
        onTurnChange(event: ThirteenAPI.TurnChangeEvent) {
            Players.slots.forEach(c => c.showTag(false));
            Players.slots[asDisplayID(event.player_id)].showTag(true);

            if (event.player_id == this.id) {
                showPlay(true);
                showPass(!event.new_pattern);

                if (event.first_turn) {
                    updateStatus("You got the first turn!");
                } else {
                    updateStatus("It is your turn!");
                }
            } else {
                showPlay(false);
                showPass(false);
            }

            if (event.new_pattern) {
                History.slots.forEach(p => {
                    DealPile.deck.addCards(...p.array.splice(0));
                });
                renderAll();
            }
        },
        onEnd(event: ThirteenAPI.EndEvent) {
            if (event.victor_id == this.id) {
                updateStatus("You won!");
            } else {
                updateStatus("You lost!");
            }
            setTimeout(() => this.disconnect(), 5000);
        }
    };
}
namespace Header {
    export let connectBtn = document.querySelector<HTMLElement>("#connect")!;
    connectBtn.onclick = () => {
        if (connectBtn.innerText == "Connect" && !Thirteen.connection) { // wss://gnarbot.xyz/thirteen/ws // 127.0.0.1:2794
            Thirteen.connection = new ThirteenAPI.Client("ws://127.0.0.1:2794", Thirteen.handler);
            connectBtn.innerText = "Disconnect";
        } else if (Thirteen.connection) {
            Thirteen.connection.disconnect();
            connectBtn.innerText = "Connect";
        }
    };
}
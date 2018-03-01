cards.init({ table: '.game' });

namespace Thirteen {
    export let connection: ThirteenAPI.Client | undefined = undefined;

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

    class DealPile {
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
        readonly tag: HTMLElement;
        readonly hand: Hand;

        constructor(readonly id: number) {
            this.tag = document.querySelectorAll<HTMLElement>('.name-tag')[id];
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

    const dealPile = new DealPile(52);
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
        showPlay(false);
        showPass(false);

        dealPile.reset();
        dealPile.deck.show();
        playerSlots.forEach(p => p.reset());

        renderAll({ speed: 2000, callback: () => dealPile.deck.show() });

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
        dealPile.deck.render(options);
        me.hand.render(options);
        me.queue.render(options);
        discardPile.render(options);
        playerSlots.forEach(h => h.hand.render(options));
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

    passButton.onclick = () => {
        if (connection) {
            connection.send({ type: "PASS" });
        }
    };

    playButton.onclick = () => {
        if (connection) {
            connection.send({ type: "PLAY", card_ids: me.queue.array.map(c => c.id) });
        }
    };

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
            playerIDs = utils.rotate(event.player_ids.slice(0), connection!.id);
            dealPile.deck.deal(event.cards_per_player, playerSlots.slice(0, playerIDs.length).map(s => s.hand), 75, () => {
                transmuteCards(event.your_cards, me.hand.array);
                me.hand.face(true);
                dealPile.deck.hide();
                renderAll();
            });
        },
        onStatus(event: ThirteenAPI.StatusEvent) {
            updateStatus(event.message);
        },
        onError(event: ThirteenAPI.ErrorEvent) {
            updateStatus(event.message);
        },
        onPlay(event: ThirteenAPI.PlayEvent) {
            if (!connection) return;

            dealPile.deck.addCards(...discardPile.array);
            discardPile.clear();

            let cards: Card[];

            console.log("why", event.player_id);

            if (event.player_id == connection.id) {
                cards = me.queue.array.splice(0, me.queue.array.length);
            } else {
                cards = playerSlots[asDisplayID(event.player_id)].hand.draw(event.card_ids.length, true);
                transmuteCards(event.card_ids, cards);
            }

            discardPile.addCards(...cards);
            renderAll({speed: 300});
        },
        onSuccess(event: ThirteenAPI.SuccessEvent) {
            if (event.message == "PLAY") {
                updateStatus("You successfully played this round.");
            } else {
                updateStatus("You passed for this round.");
            }
        },
        onTurnChange(event: ThirteenAPI.TurnChangeEvent) {
            playerSlots.forEach(c => c.showTag(false));
            playerSlots[asDisplayID(event.player_id)].showTag(true);

            if (event.player_id == this.id) {
                showPlay(true);
                showPass(!event.must_play);

                if (event.first_turn) {
                    updateStatus("You got the first turn!");
                } else {
                    updateStatus("It is your turn!");
                }
            } else {
                showPlay(false);
                showPass(false);
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
        if (connectBtn.innerText == "Connect" && !Thirteen.connection) {
            Thirteen.connection = new ThirteenAPI.Client("ws://gnarbot.xyz/thirteen", Thirteen.handler);
            connectBtn.innerText = "Disconnect";
        } else if (Thirteen.connection) {
            Thirteen.connection.disconnect();
            connectBtn.innerText = "Connect";
        }
    };
}
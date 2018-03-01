"use strict";
cards.init({ table: '.game' });
var Thirteen;
(function (Thirteen) {
    Thirteen.connection = undefined;
    var Card = cards.Card;
    var Deck = cards.Deck;
    var Hand = cards.Hand;
    var Anchor = cards.Anchor;
    Thirteen.playerIDs = [];
    function transmuteCards(ids, cards) {
        if (ids.length != cards.length) {
            throw new Error("cards and ids are not the same length");
        }
        for (let i = 0; i < cards.length; i++) {
            cards[i].id = ids[i];
        }
        return cards;
    }
    class DealPile {
        constructor(n) {
            this.cards = [];
            this.deck = new Deck();
            for (let i = 0; i < n; i++) {
                this.cards.push(new Card(0));
            }
            this.deck.addCards(...this.cards);
        }
        reset() {
            this.deck.array.forEach(c => c.id = 0);
            this.deck.clear();
            this.deck.addCards(...this.cards);
        }
        get(n) {
            return this.deck.array[n];
        }
    }
    class PlayerSlot {
        constructor(id) {
            this.id = id;
            this.tag = document.querySelectorAll('.name-tag')[id];
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
        set name(name) {
            this.tag.innerText = name;
        }
        showTag(on) {
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
    Thirteen.playerSlots = [];
    for (let i = 0; i < 4; i++) {
        Thirteen.playerSlots.push(new PlayerSlot(i));
    }
    const me = {
        hand: Thirteen.playerSlots[0].hand,
        queue: new Hand({ faceUp: true, position: new Anchor({ bottom: 125 }) })
    };
    function reset() {
        showPlay(false);
        showPass(false);
        dealPile.reset();
        dealPile.deck.show();
        Thirteen.playerSlots.forEach(p => p.reset());
        renderAll({ speed: 2000, callback: () => dealPile.deck.show() });
        updateStatus("Press Start Game to connect to the server!");
    }
    Thirteen.reset = reset;
    function asDisplayID(targetID) {
        for (let i = 0; i < Thirteen.playerIDs.length; i++) {
            if (Thirteen.playerIDs[i] == targetID) {
                return i;
            }
        }
        throw Error("Invalid id");
    }
    Thirteen.asDisplayID = asDisplayID;
    function renderAll(options) {
        dealPile.deck.render(options);
        me.hand.render(options);
        me.queue.render(options);
        discardPile.render(options);
        Thirteen.playerSlots.forEach(h => h.hand.render(options));
    }
    const playButton = document.querySelector("#play");
    const passButton = document.querySelector("#pass");
    function showPlay(on) {
        console.log("Show play ", on);
        playButton.style.display = on ? 'block' : 'none';
    }
    Thirteen.showPlay = showPlay;
    function showPass(on) {
        passButton.style.display = on ? 'block' : 'none';
    }
    Thirteen.showPass = showPass;
    function updateStatus(msg) {
        document.querySelector(".status .text").innerText = msg;
    }
    Thirteen.updateStatus = updateStatus;
    passButton.onclick = () => {
        if (Thirteen.connection) {
            Thirteen.connection.send({ type: "PASS" });
        }
    };
    playButton.onclick = () => {
        if (Thirteen.connection) {
            Thirteen.connection.send({ type: "PLAY", card_ids: me.queue.array.map(c => c.id) });
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
    Thirteen.handler = {
        onConnect(event) {
            console.log("Connected to server.");
            Header.connectBtn.innerText = "Disconnect";
        },
        onDisconnect(event) {
            console.log("Disconnected from server.");
            Header.connectBtn.innerText = "Connect";
            Thirteen.connection = undefined;
            reset();
        },
        onQueueUpdate(event) {
            updateStatus(`${event.size}/${event.goal} connected players!`);
        },
        onReady(event) {
            Thirteen.playerIDs = utils.rotate(event.player_ids.slice(0), Thirteen.connection.id);
            dealPile.deck.deal(event.cards_per_player, Thirteen.playerSlots.slice(0, Thirteen.playerIDs.length).map(s => s.hand), 75, () => {
                transmuteCards(event.your_cards, me.hand.array);
                me.hand.face(true);
                dealPile.deck.hide();
                renderAll();
            });
        },
        onStatus(event) {
            updateStatus(event.message);
        },
        onError(event) {
            updateStatus(event.message);
        },
        onPlay(event) {
            if (!Thirteen.connection)
                return;
            dealPile.deck.addCards(...discardPile.array);
            discardPile.clear();
            let cards;
            console.log("why", event.player_id);
            if (event.player_id == Thirteen.connection.id) {
                cards = me.queue.array.splice(0, me.queue.array.length);
            }
            else {
                cards = Thirteen.playerSlots[asDisplayID(event.player_id)].hand.draw(event.card_ids.length, true);
                transmuteCards(event.card_ids, cards);
            }
            discardPile.addCards(...cards);
            renderAll({ speed: 300 });
        },
        onSuccess(event) {
            if (event.message == "PLAY") {
                updateStatus("You successfully played this round.");
            }
            else {
                updateStatus("You passed for this round.");
            }
        },
        onTurnChange(event) {
            Thirteen.playerSlots.forEach(c => c.showTag(false));
            Thirteen.playerSlots[asDisplayID(event.player_id)].showTag(true);
            if (event.player_id == this.id) {
                showPlay(true);
                showPass(!event.must_play);
                if (event.first_turn) {
                    updateStatus("You got the first turn!");
                }
                else {
                    updateStatus("It is your turn!");
                }
            }
            else {
                showPlay(false);
                showPass(false);
            }
        },
        onEnd(event) {
            if (event.victor_id == this.id) {
                updateStatus("You won!");
            }
            else {
                updateStatus("You lost!");
            }
            setTimeout(() => this.disconnect(), 5000);
        }
    };
})(Thirteen || (Thirteen = {}));
var Header;
(function (Header) {
    Header.connectBtn = document.querySelector("#connect");
    Header.connectBtn.onclick = () => {
        if (Header.connectBtn.innerText == "Connect" && !Thirteen.connection) {
            Thirteen.connection = new ThirteenAPI.Client("ws://gnarbot.xyz/thirteen", Thirteen.handler);
            Header.connectBtn.innerText = "Disconnect";
        }
        else if (Thirteen.connection) {
            Thirteen.connection.disconnect();
            Header.connectBtn.innerText = "Connect";
        }
    };
})(Header || (Header = {}));

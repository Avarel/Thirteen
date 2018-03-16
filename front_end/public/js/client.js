CardsJS.init({ table: '.game' });
var Thirteen;
(function (Thirteen) {
    Thirteen.connection = undefined;
    var Card = CardsJS.Card;
    var Deck = CardsJS.Deck;
    var Hand = CardsJS.Hand;
    var Anchor = CardsJS.Anchor;
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
    let DealPile;
    (function (DealPile) {
        const cards = [];
        DealPile.deck = new Deck();
        function reset() {
            DealPile.deck.array.forEach(c => c.id = 0);
            DealPile.deck.clear();
            DealPile.deck.addCards(...cards);
        }
        DealPile.reset = reset;
        function init(n) {
            for (let i = 0; i < n; i++) {
                cards.push(new Card(0));
            }
            DealPile.deck.addCards(...cards);
        }
        init(52);
    })(DealPile || (DealPile = {}));
    let Players;
    (function (Players) {
        class Slot {
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
        Players.slots = [];
        for (let i = 0; i < 4; i++) {
            Players.slots.push(new Slot(i));
        }
        Players.self = {
            hand: Players.slots[0].hand,
            queue: new Hand({ faceUp: true, position: new Anchor({ bottom: 125 }) })
        };
    })(Players || (Players = {}));
    let History;
    (function (History) {
        History.slots = [];
        for (let i = 0; i < 3; i++) {
            History.slots.push(new Hand({ faceUp: true, position: new Anchor({ cx: 0, cy: 10 - i * 20 }), zIndex: 5 - i }));
        }
    })(History || (History = {}));
    function reset() {
        showPlay(false);
        showPass(false);
        DealPile.reset();
        DealPile.deck.show();
        Players.slots.forEach(p => p.reset());
        History.slots.forEach(h => h.clear());
        renderAll({ speed: 2000, callback: () => DealPile.deck.show() });
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
        DealPile.deck.render(options);
        Players.self.hand.render(options);
        Players.self.queue.render(options);
        History.slots.forEach(h => h.render(options));
        Players.slots.forEach(h => h.hand.render(options));
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
        if (Thirteen.connection) {
            Thirteen.connection.send({ type: "PASS" });
        }
    };
    playButton.onclick = () => {
        if (Thirteen.connection) {
            Thirteen.connection.send({ type: "PLAY", card_ids: Players.self.queue.array.map(c => c.id) });
        }
    };
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
            Thirteen.playerIDs = utils.rotate(event.player_ids.slice(0), event.player_ids.indexOf(Thirteen.connection.id));
            DealPile.deck.deal(event.cards_per_player, Players.slots.slice(0, Thirteen.playerIDs.length).map(s => s.hand), 50, () => {
                transmuteCards(event.your_cards, Players.self.hand.array);
                Players.self.hand.face(true);
                DealPile.deck.hide();
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
            let cards;
            if (event.player_id == Thirteen.connection.id) {
                cards = Players.self.queue.array.splice(0, Players.self.queue.array.length);
            }
            else {
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
        onSuccess(event) {
            if (event.message == "PLAY") {
                updateStatus("You successfully played this round.");
            }
            else {
                updateStatus("You passed for this round.");
            }
        },
        onTurnChange(event) {
            Players.slots.forEach(c => c.showTag(false));
            Players.slots[asDisplayID(event.player_id)].showTag(true);
            if (event.player_id == this.id) {
                showPlay(true);
                showPass(!event.new_pattern);
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
            if (event.new_pattern) {
                History.slots.forEach(p => {
                    DealPile.deck.addCards(...p.array.splice(0));
                });
                renderAll();
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
            Thirteen.connection = new ThirteenAPI.Client("ws://127.0.0.1:2794", Thirteen.handler);
            Header.connectBtn.innerText = "Disconnect";
        }
        else if (Thirteen.connection) {
            Thirteen.connection.disconnect();
            Header.connectBtn.innerText = "Connect";
        }
    };
})(Header || (Header = {}));

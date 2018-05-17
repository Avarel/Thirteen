"use strict";
let table = document.querySelector('.game');
CardsJS.init({ table: table });
var Card = CardsJS.Card;
var Deck = CardsJS.Deck;
var Hand = CardsJS.Hand;
var Anchor = CardsJS.Anchor;
let game;
function updateStatus(msg) {
    document.querySelector('.status .text').innerText = msg;
}
class Game {
    constructor(table) {
        this.table = table;
        // wss://gnarbot.xyz/thirteen/ws // 127.0.0.1:2794
        this.api = new ThirteenAPI.Client('wss://gnarbot.xyz/thirteen/ws', this);
        this.players = [];
        this.dealDeck = new Deck();
        this.history = new GameHistory(3);
        for (let i = 0; i < 52; i++) {
            this.dealDeck.addCards(new Card(0));
        }
        this.dealDeck.render();
        this.playButton = document.querySelector('#play');
        this.passButton = document.querySelector('#pass');
    }
    get selfPlayer() {
        return this.players[0];
    }
    getPlayerByID(id) {
        return this.players.find(p => p.id == id);
    }
    onConnect(event) {
        console.log("Connected to server.");
    }
    onDisconnect(event) {
        console.log("Disconnected from server.");
        Header.loginBox(true, true);
        Header.connectBtn.innerText = 'Connect';
        game = undefined;
        this.delete();
    }
    onIdentify(event) {
        let name = Header.usernameSelect.value;
        let size = parseInt(Header.gameSizeSelect.value);
        Header.loginBox(false, true);
        this.api.send({
            type: 'JOIN_GAME',
            name: name,
            game_size: size
        });
    }
    onQueueUpdate(event) {
        updateStatus(`Finding game... ${event.size}/${event.goal} connected players!`);
    }
    static transmuteCards(ids, cards) {
        if (ids.length != cards.length) {
            throw new Error('cards and ids are not the same length');
        }
        for (let i = 0; i < cards.length; i++) {
            cards[i].id = ids[i];
        }
        return cards;
    }
    renderAll(options) {
        this.dealDeck.render(options);
        this.selfPlayer.queueCards.render(options);
        this.history.render(options);
        this.players.forEach(p => p.cards.render(options));
    }
    onReady(event) {
        Header.loginBox(false, false);
        let players_data = utils.rotate(event.players.slice(0), event.players.findIndex(it => it.id == this.api.id));
        for (let [index, data] of players_data.entries()) {
            this.players.push(new Player(this, index, data.id, data.name));
        }
        this.dealDeck.deal(event.cards_per_player, this.players.map(p => p.cards), 50, () => {
            Game.transmuteCards(event.your_cards, this.selfPlayer.cards.array);
            this.selfPlayer.cards.face(true);
            this.dealDeck.display(false);
            this.renderAll();
        });
    }
    onEnd(event) {
        if (event.victor_id == this.selfPlayer.id) {
            updateStatus('You won!');
        }
        else {
            updateStatus('You lost!');
        }
        setTimeout(() => this.api.disconnect(), 5000);
    }
    onPlay(event) {
        let cards;
        if (event.player_id == this.selfPlayer.id) {
            cards = [];
            for (let card_id of event.card_ids) {
                let card = this.selfPlayer.queueCards.removeID(card_id);
                if (!card)
                    card = this.selfPlayer.cards.removeID(card_id);
                if (!card)
                    throw Error("Player is missing cards?");
                cards.push(card);
            }
        }
        else {
            cards = this.getPlayerByID(event.player_id).cards.draw(event.card_ids.length, true);
            Game.transmuteCards(event.card_ids, cards);
        }
        this.history.push(...cards);
        this.renderAll({ speed: 300 });
    }
    onTurnChange(event) {
        this.players.filter(p => p.id != event.player_id).forEach(p => p.tag.hidden = true);
        this.getPlayerByID(event.player_id).tag.hidden = false;
        if (event.player_id == this.selfPlayer.id) {
            this.playButton.hidden = false;
            this.passButton.hidden = event.new_pattern;
            if (event.first_turn) {
                updateStatus('You got the first turn!');
            }
            else {
                updateStatus('It is your turn!');
            }
        }
        else {
            this.playButton.hidden = true;
            this.passButton.hidden = true;
        }
        if (event.new_pattern) {
            this.history.clear();
            this.renderAll();
        }
    }
    onSuccess(event) {
        switch (event.message) {
            case 'PLAY':
                updateStatus('You successfully played this round.');
                break;
            case 'PASS':
                updateStatus('You passed for this round.');
                break;
        }
    }
    onError(event) {
        switch (event.message) {
            case 'INVALID_CARD':
                updateStatus('Invalid cards. (Client sent invalid ids)');
                break;
            case 'INVALID_PATTERN':
                updateStatus('Your pattern is not valid.');
                break;
            case 'BAD_PATTERN':
                updateStatus("Your pattern does not match the pile's pattern.");
                break;
            case 'BAD_CARD':
                updateStatus("Your hand's highest must be higher than the pile's highest card.");
                break;
            case 'OUT_OF_TURN':
                updateStatus("It's not your turn right now! Wait a bit.");
                break;
            case 'MUST_START_NEW_PATTERN':
                updateStatus('You must start a new pattern.');
                break;
            case 'NO_CARDS':
                updateStatus("You can't play nothing.");
                break;
            case 'MUST_PLAY_LOWEST':
                updateStatus('You must play your lowest card for this turn.');
                break;
        }
    }
    delete() {
        this.players.forEach(p => p.delete());
        this.dealDeck.delete();
        this.api.disconnect();
        this.history.clear();
        this.playButton.hidden = true;
        this.passButton.hidden = true;
        updateStatus('Press Connect to look for a game!');
    }
}
class GameHistory {
    constructor(size) {
        this.slots = [];
        for (let i = 0; i < size; i++) {
            this.slots.push(new Hand({ faceUp: true, position: new Anchor({ cx: 0, cy: 10 - i * 20 }), zIndex: 5 - i }));
        }
    }
    push(...cards) {
        this.slots[this.slots.length - 1].delete();
        for (let i = this.slots.length - 1; i > 0; i--) {
            this.slots[i].addCards(...this.slots[i - 1].array.splice(0));
        }
        this.slots[0].addCards(...cards);
    }
    render(options) {
        this.slots.forEach(s => s.render(options));
    }
    clear() {
        this.slots.forEach(s => s.delete());
    }
}
class Player {
    constructor(game, index, id, username) {
        this.id = id;
        this.username = username;
        this.tag = document.createElement('div');
        this.tag.style.position = 'absolute';
        this.tag.style.textAlign = 'center';
        this.tag.style.userSelect = 'none';
        this.tag.style.textShadow = '0 0 10px black';
        this.tag.style.zIndex = '1000';
        switch (index) {
            case 0:
                this.cards = new Hand({ position: new Anchor({ bottom: 25 }), angle: 0, zIndex: 5 });
                this.queue = new Hand({ faceUp: true, position: new Anchor({ bottom: 100 }) });
                this.cards.click(card => {
                    this.queue.addCards(card);
                    this.cards.render();
                    this.queue.render();
                });
                this.queue.click(card => {
                    this.cards.addCards(card);
                    this.cards.render();
                    this.queue.render();
                });
                game.passButton.onclick = () => game.api.send({ type: 'PASS' });
                game.playButton.onclick = () => game.api.send({ type: 'PLAY', card_ids: this.queueCards.array.map(c => c.id) });
                this.tag.style.bottom = '0px';
                this.tag.style.width = '100%';
                break;
            case 1:
                this.cards = new Hand({ position: new Anchor({ top: 0 }), angle: 180 });
                this.tag.style.top = '0px';
                this.tag.style.width = '100%';
                break;
            case 2:
                this.cards = new Hand({ position: new Anchor({ left: 0 }), angle: 90 });
                this.tag.style.writingMode = 'vertical-lr';
                this.tag.style.left = '0px';
                this.tag.style.height = '100%';
                break;
            case 3:
                this.cards = new Hand({ position: new Anchor({ right: 0 }), angle: 270 });
                this.tag.style.writingMode = 'vertical-rl';
                this.tag.style.right = '0px';
                this.tag.style.height = '100%';
                break;
            default:
                throw new Error('Something happened while loading...');
        }
        this.tag.innerText = username;
        game.table.appendChild(this.tag);
    }
    get queueCards() {
        if (this.queue) {
            return this.queue;
        }
        else {
            throw Error("Tried access queue of other players");
        }
    }
    delete() {
        this.cards.delete();
        this.tag.remove();
    }
}
var Header;
(function (Header) {
    Header.connectBtn = document.querySelector('#connect');
    Header.usernameSelect = document.querySelector("#username-select");
    Header.gameSizeSelect = document.querySelector("#game-size-select");
    Header.connectBtn.onclick = () => {
        if (Header.connectBtn.innerText == 'Connect' && !game) {
            game = new Game(table);
            if (Header.usernameSelect.value == '') {
                Header.usernameSelect.value = utils.randomName();
            }
            Header.connectBtn.innerText = 'Disconnect';
            loginBox(false, true);
        }
        else if (game) {
            game.api.disconnect();
            game = undefined;
            Header.connectBtn.innerText = 'Connect';
            loginBox(true, true);
        }
    };
    function loginBox(edit, show) {
        document.querySelector("#username-select").disabled = !edit;
        document.querySelector("#game-size-select").disabled = !edit;
        document.querySelector('.login-box').hidden = !show;
    }
    Header.loginBox = loginBox;
})(Header || (Header = {}));
updateStatus('Press Connect to look for a game!');

"use strict";
var CardsJS;
(function (CardsJS) {
    CardsJS.opt = {
        cardSize: { width: 80, height: 120, padding: 20 },
        animationSpeed: 150,
        table: document.querySelector('body'),
        cardBack: 'red',
        cardUrl: './assets/img/cards.png'
    };
    let data = new Map();
    function init(options) {
        if (options) {
            for (let i in options) {
                if (CardsJS.opt.hasOwnProperty(i) && options[i]) {
                    CardsJS.opt[i] = options[i];
                }
            }
        }
        CardsJS.opt.table.style.position = 'relative';
    }
    CardsJS.init = init;
    function newDeck() {
        let all = [];
        for (let i = 0; i < 52; i++) {
            all.push(new Card(i));
        }
        return all;
    }
    CardsJS.newDeck = newDeck;
    let Suit;
    (function (Suit) {
        Suit[Suit["Spades"] = 0] = "Spades";
        Suit[Suit["Clubs"] = 1] = "Clubs";
        Suit[Suit["Diamonds"] = 2] = "Diamonds";
        Suit[Suit["Hearts"] = 3] = "Hearts";
    })(Suit = CardsJS.Suit || (CardsJS.Suit = {}));
    class Card {
        constructor(id) {
            this.id = id;
            this.faceUp = false;
            this.hidden = false;
            this.element = document.createElement('div');
            this.element.className = 'card';
            this.element.style.width = `${CardsJS.opt.cardSize.width}px`;
            this.element.style.height = `${CardsJS.opt.cardSize.height}px`;
            this.element.style.backgroundImage = `url(${CardsJS.opt.cardUrl})`;
            this.element.style.position = 'absolute';
            this.element.style.cursor = 'pointer';
            this.element.onclick = function (ev) {
                let card = data.get(this);
                if (card.container) {
                    let handler = card.container.clickHandler;
                    if (handler) {
                        handler.func.call(handler.context || window, card, ev);
                    }
                }
            };
            data.set(this.element, this);
            CardsJS.opt.table.appendChild(this.element);
            this.face(false);
        }
        delete() {
            data.delete(this.element);
            this.element.remove();
        }
        static from(suit, rank) {
            return new Card(this.calculateID(suit, rank));
        }
        static calculateID(suit, rank) {
            if (0 > rank || rank >= 13) {
                throw new Error('Illegal rank');
            }
            switch (suit) {
                case Suit.Spades:
                    return rank;
                case Suit.Clubs:
                    return rank + 13;
                case Suit.Diamonds:
                    return rank + 26;
                case Suit.Hearts:
                    return rank + 39;
            }
        }
        get rank() {
            if (0 <= this.id && this.id < 13) {
                return this.id;
            }
            else if (13 <= this.id && this.id < 26) {
                return this.id - 13;
            }
            else if (26 <= this.id && this.id < 39) {
                return this.id - 26;
            }
            else if (39 <= this.id && this.id < 52) {
                return this.id - 39;
            }
            throw new Error('Illegal id');
        }
        get vcRank() {
            switch (this.rank) {
                case 0:
                    return 11;
                case 1:
                    return 12;
                default:
                    return this.rank - 2;
            }
        }
        get suit() {
            if (0 <= this.id && this.id < 13) {
                return Suit.Spades;
            }
            else if (13 <= this.id && this.id < 26) {
                return Suit.Clubs;
            }
            else if (26 <= this.id && this.id < 39) {
                return Suit.Diamonds;
            }
            else if (39 <= this.id && this.id < 52) {
                return Suit.Hearts;
            }
            throw new Error('Illegal id');
        }
        toString() {
            return `${this.suit}${this.rank}`;
        }
        moveTo(x, y, speed) {
            if (speed == 0) {
                this.element.style.top = `${y}px`;
                this.element.style.left = `${x}px`;
            }
            else {
                this.element.style.transition = `all ease-in-out ${speed}ms`;
                this.element.style.top = `${y}px`;
                this.element.style.left = `${x}px`;
                setTimeout(() => {
                    this.element.style.transition = null;
                }, speed);
            }
        }
        rotate(angle) {
            this.element.style.transform = `rotate(${angle}deg)`;
        }
        face(up) {
            if (up) {
                let rank = this.rank;
                let xpos = -(rank + 1) * CardsJS.opt.cardSize.width;
                let ypos = CardsJS.opt.cardSize.height;
                switch (this.suit) {
                    case Suit.Spades:
                        ypos *= -3;
                        break;
                    case Suit.Clubs:
                        ypos *= -0;
                        break;
                    case Suit.Diamonds:
                        ypos *= -1;
                        break;
                    case Suit.Hearts:
                        ypos *= -2;
                        break;
                }
                this.element.style.backgroundPosition = `${xpos}px ${ypos}px`;
            }
            else {
                let y = CardsJS.opt.cardBack == 'red' ? 0 : -CardsJS.opt.cardSize.height;
                this.element.style.backgroundPosition = '0px ' + y + 'px';
            }
        }
        display(show) {
            if (show) {
                this.hidden = false;
                this.element.style.display = 'block';
            }
            else {
                this.hidden = true;
                this.element.style.display = 'none';
            }
        }
    }
    CardsJS.Card = Card;
    class Anchor {
        constructor(argument = { cx: 0, cy: 0 }) {
            if (argument.left !== undefined) {
                this.left = argument.left;
            }
            else if (argument.right !== undefined) {
                this.right = argument.right;
            }
            if (argument.top !== undefined) {
                this.top = argument.top;
            }
            else if (argument.bottom !== undefined) {
                this.bottom = argument.bottom;
            }
            if (argument.cx !== undefined) {
                this.cx = argument.cx;
            }
            if (argument.cy !== undefined) {
                this.cy = argument.cy;
            }
        }
        get x() {
            if (this.left !== undefined) {
                return this.left;
            }
            if (this.right !== undefined) {
                return CardsJS.opt.table.clientWidth - this.right;
            }
            return CardsJS.opt.table.clientWidth / 2 + (this.cx || 0);
        }
        set x(xPos) {
            this.left = xPos;
        }
        get y() {
            if (this.top !== undefined) {
                return this.top;
            }
            if (this.bottom !== undefined) {
                return CardsJS.opt.table.clientHeight - this.bottom;
            }
            return CardsJS.opt.table.clientHeight / 2 + (this.cy || 0);
        }
        set y(yPos) {
            this.top = yPos;
        }
    }
    CardsJS.Anchor = Anchor;
    class Container {
        constructor({ position, angle, faceUp, hidden, zIndex } = {}) {
            this.array = [];
            this.position = position || new Anchor();
            this.angle = angle || 0;
            this.faceUp = faceUp || false;
            this.hidden = hidden || false;
            this.zIndex = zIndex || 0;
        }
        clear() {
            this.array.length = 0;
        }
        sort() {
            let zip = [];
            for (let i = 0; i < this.array.length; i++) {
                zip.push([i, this.array[i]]);
            }
            zip.sort((a, b) => {
                let compare = a[1].vcRank - b[1].vcRank;
                if (compare == 0) {
                    compare = a[1].suit - b[1].suit;
                }
                if (compare == 0) {
                    return a[0] - b[0];
                }
                return compare;
            });
            this.array = zip.map(([_, c]) => c);
        }
        shuffle() {
            let i = this.array.length;
            if (i == 0)
                return;
            while (--i) {
                let j = Math.floor(Math.random() * (i + 1));
                let tempi = this.array[i];
                let tempj = this.array[j];
                this.array[i] = tempj;
                this.array[j] = tempi;
            }
        }
        draw(n, random) {
            if (random) {
                let cards = [];
                for (let i = 0; i < n; i++) {
                    cards.push(this.array.splice(Math.floor(Math.random() * this.array.length), 1)[0]);
                }
                return cards;
            }
            else {
                return this.array.splice(0, n);
            }
        }
        addCards(...cards) {
            for (let i = 0; i < cards.length; i++) {
                let card = cards[i];
                if (card.container) {
                    card.container.removeCards(card);
                }
                this.array.push(card);
                card.container = this;
            }
        }
        removeCards(...cards) {
            let removed = [];
            for (let j = 0; j < cards.length; j++) {
                for (let i = 0; i < this.array.length; i++) {
                    if (this.array[i] == cards[j]) {
                        removed.push(this.array.splice(i, 1)[0]);
                    }
                }
            }
            return removed;
        }
        removeID(id) {
            let i = this.array.findIndex(c => c.id == id);
            return i != -1 ? this.array.splice(i, 1)[0] : undefined;
        }
        topCard() {
            return this.array[this.array.length - 1];
        }
        face(up) {
            this.faceUp = up;
        }
        click(func, context) {
            this.clickHandler = { func, context };
        }
        render({ speed, callback } = {}) {
            this.sort();
            speed = (speed || CardsJS.opt.animationSpeed);
            this.calcPosition();
            let zIndexCounter = this.zIndex * 52;
            for (let i = 0; i < this.array.length; i++) {
                let card = this.array[i];
                card.element.style.zIndex = (zIndexCounter++).toString();
                card.moveTo(card.targetPosition.left, card.targetPosition.top, speed);
            }
            let update = () => {
                for (let i = 0; i < this.array.length; i++) {
                    this.array[i].face(this.faceUp);
                }
                this.display(!this.hidden);
            };
            if (speed == 0) {
                update();
            }
            else {
                setTimeout(update, speed);
            }
            if (callback) {
                setTimeout(callback, speed);
            }
        }
        display(show) {
            this.hidden = !show;
            for (let card of this.array) {
                card.display(show);
            }
        }
        toString() {
            return 'Container';
        }
        delete() {
            for (let card of this.array) {
                card.delete();
            }
            this.array.length = 0;
        }
    }
    CardsJS.Container = Container;
    class Deck extends Container {
        constructor(options = {}) {
            super(options);
        }
        calcPosition() {
            let left = Math.round(this.position.x - CardsJS.opt.cardSize.width / 2);
            let top = Math.round(this.position.y - CardsJS.opt.cardSize.height / 2);
            let condenseCount = 6;
            for (let i = 0; i < this.array.length; i++) {
                let card = this.array[i];
                if (i > 0 && i % condenseCount == 0) {
                    top -= 1;
                    left -= 1;
                }
                card.rotate(this.angle);
                card.targetPosition = { top, left };
            }
        }
        toString() {
            return 'Deck';
        }
        deal(count, hands, speed, callback) {
            let me = this;
            let i = 0;
            let totalCount = count * hands.length;
            function dealOne() {
                if (me.array.length == 0 || i == totalCount) {
                    if (callback) {
                        callback();
                    }
                    return;
                }
                hands[i % hands.length].addCards(me.topCard());
                hands[i % hands.length].render({ callback: dealOne, speed: speed });
                i++;
            }
            dealOne();
        }
    }
    CardsJS.Deck = Deck;
    class Hand extends Container {
        constructor(options = {}) {
            super(options);
        }
        calcPosition() {
            let paddingCount = this.array.length - 1;
            let angle = this.angle * (Math.PI / 180);
            let width = CardsJS.opt.cardSize.width + paddingCount * CardsJS.opt.cardSize.padding * Math.cos(angle);
            let height = CardsJS.opt.cardSize.height - paddingCount * CardsJS.opt.cardSize.padding * Math.sin(angle);
            let left = Math.round(this.position.x - width / 2);
            let top = Math.round(this.position.y - height / 2);
            for (let i = 0; i < this.array.length; i++) {
                let card = this.array[i];
                card.rotate(this.angle);
                card.targetPosition = {
                    top: top - i * CardsJS.opt.cardSize.padding * Math.sin(angle),
                    left: left + i * CardsJS.opt.cardSize.padding * Math.cos(angle)
                };
            }
        }
        toString() {
            return 'Hand' + super.toString();
        }
    }
    CardsJS.Hand = Hand;
    class Pile extends Container {
        constructor() {
            super(...arguments);
            this.dealCounter = 0;
        }
        calcPosition() {
            let left = Math.round(this.position.x - CardsJS.opt.cardSize.width / 2);
            let top = Math.round(this.position.y - CardsJS.opt.cardSize.height / 2);
            for (let i = 0; i < this.array.length; i++) {
                this.array[i].targetPosition = { top, left };
            }
        }
        toString() {
            return 'Pile';
        }
        deal(count, hands) {
            if (!this.dealCounter) {
                this.dealCounter = count * hands.length;
            }
        }
    }
    CardsJS.Pile = Pile;
})(CardsJS || (CardsJS = {}));
;

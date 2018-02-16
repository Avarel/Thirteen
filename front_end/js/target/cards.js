var cards;
(function (cards_1) {
    let opt = {
        cardSize: { width: 69, height: 94, padding: 18 },
        animationSpeed: 150,
        table: 'body',
        cardback: 'red',
        cardsUrl: 'img/cards.png'
    };
    let zIndexCounter = 1;
    cards_1.all = []; //All the cards created.
    function mouseEvent(ev) {
        let card = $(this).data('card');
        if (card.container) {
            let handler = card.container.clickHandler;
            if (handler) {
                handler.func.call(handler.context || window, card, ev);
            }
        }
    }
    function init(options) {
        if (options) {
            for (let i in options) {
                if (opt.hasOwnProperty(i)) {
                    opt[i] = options[i];
                }
            }
        }
        // opt.table = $(opt.table)[0];
        if ($(opt.table).css('position') == 'static') {
            $(opt.table).css('position', 'relative');
        }
        for (let i = 0; i < 52; i++) {
            cards_1.all.push(new Card(i));
        }
        $('.card').click(mouseEvent);
    }
    cards_1.init = init;
    function shuffle(deck) {
        let i = deck.array.length;
        if (i == 0)
            return;
        while (--i) {
            let j = Math.floor(Math.random() * (i + 1));
            let tempi = deck.array[i];
            let tempj = deck.array[j];
            deck.array[i] = tempj;
            deck.array[j] = tempi;
        }
    }
    cards_1.shuffle = shuffle;
    let Suit;
    (function (Suit) {
        Suit[Suit["Spades"] = 0] = "Spades";
        Suit[Suit["Clubs"] = 1] = "Clubs";
        Suit[Suit["Diamonds"] = 2] = "Diamonds";
        Suit[Suit["Hearts"] = 3] = "Hearts";
    })(Suit = cards_1.Suit || (cards_1.Suit = {}));
    class Card {
        constructor(id) {
            this.id = id;
            this.faceUp = false;
            this.element = $('<div/>').css({
                width: opt.cardSize.width,
                height: opt.cardSize.height,
                "background-image": `url(${opt.cardsUrl})`,
                position: 'absolute',
                cursor: 'pointer'
            }).addClass('card').data('card', this).appendTo($(opt.table));
            this.showCard();
            this.moveToFront();
        }
        static fromID(id) {
            if (id < 0 || id >= 52) {
                throw "Illegal id";
            }
            return cards_1.all[id];
        }
        static from(suit, rank) {
            if (0 > rank || rank >= 13) {
                throw "Illegal rank";
            }
            switch (suit) {
                case Suit.Spades:
                    return Card.fromID(rank);
                case Suit.Clubs:
                    return Card.fromID(rank + 13);
                case Suit.Diamonds:
                    return Card.fromID(rank + 26);
                case Suit.Hearts:
                    return Card.fromID(rank + 39);
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
            throw "Illegal id";
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
            throw "Illegal id";
        }
        toString() {
            return `${this.suit}${this.rank}`;
        }
        moveTo(x, y, speed, callback) {
            let props = { top: y - (opt.cardSize.height / 2), left: x - (opt.cardSize.width / 2) };
            $(this.element).animate(props, speed || opt.animationSpeed, callback);
        }
        rotate(angle) {
            $(this.element).css('transform', `rotate(${angle}deg)`);
        }
        showCard() {
            let rank = this.rank;
            let xpos = -(rank + 1) * opt.cardSize.width;
            let ypos = opt.cardSize.height;
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
            $(this.element).css('background-position', `${xpos}px ${ypos}px`);
        }
        hideCard() {
            let y = opt.cardback == 'red' ? 0 : -opt.cardSize.height;
            $(this.element).css('background-position', '0px ' + y + 'px');
        }
        moveToFront() {
            $(this.element).css('z-index', zIndexCounter++);
        }
    }
    cards_1.Card = Card;
    class Anchor {
        constructor({ left, right, top, bottom } = {}) {
            if (left !== undefined && right !== undefined) {
                throw "Can not have left and right prop at the same time.";
            }
            else if (top !== undefined && right !== undefined) {
                throw "Can not have top and bottom prop at the same time.";
            }
            this.left = left;
            this.right = right;
            this.top = top;
            this.bottom = bottom;
        }
        get x() {
            if (this.left !== undefined) {
                return this.left;
            }
            if (this.right !== undefined) {
                return ($(opt.table).width() || 0) - this.right;
            }
            return ($(opt.table).width() || 0) / 2;
        }
        set x(xPos) {
            this.left = xPos;
        }
        get y() {
            if (this.top !== undefined) {
                return this.top;
            }
            if (this.bottom !== undefined) {
                return ($(opt.table).height() || 0) - this.bottom;
            }
            return ($(opt.table).height() || 0) / 2;
        }
        set y(yPos) {
            this.top = yPos;
        }
    }
    cards_1.Anchor = Anchor;
    class Container {
        constructor({ position, angle, faceUp } = {}) {
            this.array = [];
            this.position = position || new Anchor();
            this.angle = angle || 0;
            this.faceUp = faceUp;
        }
        sort() {
            this.array.sort((a, b) => {
                let compare = a.vcRank - b.vcRank;
                return compare === 0 ? a.suit - b.suit : compare;
            });
        }
        // lowerhand.addCards([12,3,4,5,6].map(cards.Card.fromID)); lowerhand.render()
        addCards(...cards) {
            for (let i = 0; i < cards.length; i++) {
                let card = cards[i];
                if (card.container) {
                    card.container.removeCard(card);
                }
                this.array.push(card);
                card.container = this;
            }
        }
        removeCard(card) {
            for (let i = 0; i < this.array.length; i++) {
                if (this.array[i] == card) {
                    this.array.splice(i, 1);
                    return true;
                }
            }
            return false;
        }
        click(func, context) {
            this.clickHandler = { func, context };
        }
        render({ speed, immediate, callback } = {}) {
            this.sort();
            speed = (speed || opt.animationSpeed);
            this.calcPosition();
            for (let i = 0; i < this.array.length; i++) {
                let card = this.array[i];
                zIndexCounter++;
                card.moveToFront();
                let props = {
                    top: card.targetPosition.top,
                    left: card.targetPosition.left,
                };
                if (immediate) {
                    $(card.element).css(props);
                }
                else {
                    $(card.element).animate(props, speed);
                }
            }
            let me = this;
            let flip = function () {
                for (let i = 0; i < me.array.length; i++) {
                    if (me.faceUp) {
                        me.array[i].showCard();
                    }
                    else {
                        me.array[i].hideCard();
                    }
                }
            };
            if (immediate) {
                flip();
            }
            else {
                setTimeout(flip, speed / 2);
            }
            if (callback) {
                setTimeout(callback, speed);
            }
        }
        topCard() {
            return this.array[this.array.length - 1];
        }
        toString() {
            return 'Container';
        }
    }
    cards_1.Container = Container;
    class Deck extends Container {
        constructor(options = {}) {
            super(options);
        }
        calcPosition() {
            let left = Math.round(this.position.x - opt.cardSize.width / 2);
            let top = Math.round(this.position.y - opt.cardSize.height / 2);
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
    cards_1.Deck = Deck;
    class Hand extends Container {
        constructor(options = {}) {
            super(options);
        }
        calcPosition() {
            let paddingCount = this.array.length - 1;
            let angle = this.angle * (Math.PI / 180);
            let width = opt.cardSize.width + paddingCount * opt.cardSize.padding * Math.cos(angle);
            let height = opt.cardSize.height - paddingCount * opt.cardSize.padding * Math.sin(angle);
            let left = Math.round(this.position.x - width / 2);
            let top = Math.round(this.position.y - height / 2);
            for (let i = 0; i < this.array.length; i++) {
                let card = this.array[i];
                card.rotate(this.angle);
                card.targetPosition = {
                    top: top - i * opt.cardSize.padding * Math.sin(angle),
                    left: left + i * opt.cardSize.padding * Math.cos(angle)
                };
            }
        }
        toString() {
            return 'Hand' + super.toString();
        }
    }
    cards_1.Hand = Hand;
    class Pile extends Container {
        calcPosition() {
            let left = Math.round(this.position.x - opt.cardSize.width / 2);
            let top = Math.round(this.position.y - opt.cardSize.height / 2);
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
    cards_1.Pile = Pile;
})(cards || (cards = {}));
;

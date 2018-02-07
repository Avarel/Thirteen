let cards = (function () {
    let opt = {
        cardSize: { width: 69, height: 94, padding: 18 },
        animationSpeed: 500,
        table: 'body',
        cardback: 'red',
        acesHigh: false,
        cardsUrl: 'img/cards.png',
        blackJoker: false,
        redJoker: false
    };

    let zIndexCounter = 1;
    let all = []; //All the cards created.

    function mouseEvent(ev) {
        let card = $(this).data('card');
        if (card.container) {
            let handler = card.container._click;
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

        opt.table = $(opt.table)[0];
        if ($(opt.table).css('position') == 'static') {
            $(opt.table).css('position', 'relative');
        }
        for (let i = 0; i < 52; i++) {
            all.push(new Card(i, opt.table));
        }

        $('.card').click(mouseEvent);
        shuffle(all);
    }

    function shuffle(deck) {
        //Fisher yates shuffle
        let i = deck.length;
        if (i == 0) return;
        while (--i) {
            let j = Math.floor(Math.random() * (i + 1));
            let tempi = deck[i];
            let tempj = deck[j];
            deck[i] = tempj;
            deck[j] = tempi;
        }
    }

    class Card {
        constructor(id, table) {
            this.id = id;
            this.shortName = this.suit() + this.rank();
            this.name = this.suit().toUpperCase() + this.rank();
            this.faceUp = false;
            this.el = $('<div/>').css({
                width: opt.cardSize.width,
                height: opt.cardSize.height,
                "background-image": 'url(' + opt.cardsUrl + ')',
                position: 'absolute',
                cursor: 'pointer'
            }).addClass('card').data('card', this).appendTo($(table));
            this.showCard();
            this.moveToFront();
        }

        static from(suit, rank, table) {
            if (0 > this.id || this.id >= 13) {
                throw "Illegal rank";
            }
            switch (suit) {
                case "s":
                    return new Card(rank, table);
                case "c":
                    return new Card(rank - 13, table);
                case "d":
                    return new Card(rank - 26, table);
                case "h":
                    return new Card(rank - 39, table);
            }
        }

        rank() {
            if (0 <= this.id && this.id < 13) {
                return this.id;
            } else if (13 <= this.id && this.id < 26) {
                return this.id - 13;
            } else if (26 <= this.id && this.id < 39) {
                return this.id - 26;
            } else if (39 <= this.id && this.id < 52) {
                return this.id - 39;
            }
            throw "Illegal id";
        }

        suit() {
            if (0 <= this.id && this.id < 13) {
                return "s";
            } else if (13 <= this.id && this.id < 26) {
                return "c";
            } else if (26 <= this.id && this.id < 39) {
                return "d";
            } else if (39 <= this.id && this.id < 52) {
                return "h";
            }
            throw "Illegal id";
        }

        toString() {
            return this.name;
        }

        moveTo(x, y, speed, callback) {
            let props = { top: y - (opt.cardSize.height / 2), left: x - (opt.cardSize.width / 2) };
            $(this.el).animate(props, speed || opt.animationSpeed, callback);
        }

        rotate(angle) {
            $(this.el).css('transform', `rotate(${angle}deg)`);
        }

        showCard() {
            let offsets = { "c": 0, "d": 1, "h": 2, "s": 3 };
            let xpos, ypos;
            let rank = this.rank();
            xpos = -(rank + 1) * opt.cardSize.width;
            ypos = -offsets[this.suit()] * opt.cardSize.height;
            this.rotate(0);
            $(this.el).css('background-position', `${xpos}px ${ypos}px`);
        }

        hideCard(position) {
            let y = opt.cardback == 'red' ? 0 * opt.cardSize.height : -1 * opt.cardSize.height;
            $(this.el).css('background-position', '0px ' + y + 'px');
            this.rotate(0);
        }

        moveToFront() {
            $(this.el).css('z-index', zIndexCounter++);
        }
    }

    class Container extends Array {
        constructor(options) {
            super();
            options = options || {};
            this.x = options.x || $(opt.table).width() / 2;
            this.y = options.y || $(opt.table).height() / 2;
            this.faceUp = options.faceUp;
        }

        addCard(card) {
            this.addCards([card]);
        }

        addCards(cards) {
            for (let i = 0; i < cards.length; i++) {
                let card = cards[i];
                if (card.container) {
                    card.container.removeCard(card);
                }
                this.push(card);
                card.container = this;
            }
        }

        removeCard(card) {
            for (let i = 0; i < this.length; i++) {
                if (this[i] == card) {
                    this.splice(i, 1);
                    return true;
                }
            }
            return false;
        }

        click(func, context) {
            this._click = { func: func, context: context };
        }

        mousedown(func, context) {
            this._mousedown = { func: func, context: context };
        }

        mouseup(func, context) {
            this._mouseup = { func: func, context: context };
        }

        render(options) {
            options = options || {};
            let speed = options.speed || opt.animationSpeed;
            this.calcPosition(options);
            for (let i = 0; i < this.length; i++) {
                let card = this[i];
                zIndexCounter++;
                card.moveToFront();
                let top = parseInt($(card.el).css('top'));
                let left = parseInt($(card.el).css('left'));
                if (top != card.targetTop || left != card.targetLeft) {
                    let props = { top: card.targetTop, left: card.targetLeft, queue: false };
                    if (options.immediate) {
                        $(card.el).css(props);
                    } else {
                        $(card.el).animate(props, speed);
                    }
                }
            }
            let me = this;
            let flip = function () {
                for (let i = 0; i < me.length; i++) {
                    if (me.faceUp) {
                        me[i].showCard();
                    } else {
                        me[i].hideCard();
                    }
                }
            }
            if (options.immediate) {
                flip();
            } else {
                setTimeout(flip, speed / 2);
            }

            if (options.callback) {
                setTimeout(options.callback, speed);
            }
        }

        topCard() {
            return this[this.length - 1];
        }

        toString() {
            return 'Container';
        }
    }

    class Deck extends Container {
        constructor(options) {
            super(options);
        }

        calcPosition(options) {
            options = options || {};
            let left = Math.round(this.x - opt.cardSize.width / 2, 0);
            let top = Math.round(this.y - opt.cardSize.height / 2, 0);
            let condenseCount = 6;
            for (let i = 0; i < this.length; i++) {
                if (i > 0 && i % condenseCount == 0) {
                    top -= 1;
                    left -= 1;
                }
                this[i].targetTop = top;
                this[i].targetLeft = left;
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
                if (me.length == 0 || i == totalCount) {
                    if (callback) {
                        callback();
                    }
                    return;
                }
                hands[i % hands.length].addCard(me.topCard());
                hands[i % hands.length].render({ callback: dealOne, speed: speed });
                i++;
            }
            dealOne();
        }
    }

    class Hand extends Container {
        constructor(options) {
            super(options);
        }

        calcPosition(options) {
            options = options || {};
            let width = opt.cardSize.width + (this.length - 1) * opt.cardSize.padding;
            let left = Math.round(this.x - width / 2);
            let top = Math.round(this.y - opt.cardSize.height / 2, 0);
            for (let i = 0; i < this.length; i++) {
                this[i].targetTop = top;
                this[i].targetLeft = left + i * opt.cardSize.padding;
            }
        }

        toString() {
            return 'Hand';
        }
    }

    class Pile extends Container {
        calcPosition(options) {
            options = options || {};
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

    return {
        init: init,
        all: all,
        options: opt,
        SIZE: opt.cardSize,
        Card: Card,
        Container: Container,
        Deck: Deck,
        Hand: Hand,
        Pile: Pile,
        shuffle: shuffle
    };
})();

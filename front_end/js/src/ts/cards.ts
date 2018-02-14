namespace cards {
    let opt = {
        cardSize: { width: 69, height: 94, padding: 18 },
        animationSpeed: 150,
        table: 'body' as any,
        cardback: 'red',
        cardsUrl: 'img/cards.png',
        blackJoker: false,
        redJoker: false
    };

    type Callback<T> = (...args: any[]) => T;

    let zIndexCounter = 1;

    export let all: Card[] = []; //All the cards created.

    function mouseEvent(ev) {
        let card: Card = $(this).data('card');
        if (card.container) {
            let handler = card.container._click;
            if (handler) {
                handler.func.call(handler.context || window, card, ev);
            }
        }
    }

    export function init(options) {
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
            all.push(new Card(i));
        }

        $('.card').click(mouseEvent);
    }

    export function shuffle(deck) {
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

    export enum Suit {
        Spades,
        Clubs,
        Diamonds,
        Hearts
    }

    export class Card {
        readonly id: number;
        faceUp: boolean;
        container: Container;
        targetPosition: { top: number, left: number };

        element: JQuery<HTMLElement>;

        constructor(id: number) {
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

        static fromID(id): Card {
            if (id < 0 || id >= 52) {
                throw "Illegal id";
            }
            return all[id];
        }

        static from(suit: Suit, rank: number): Card {
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

        get rank(): number {
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

        get vcRank(): number {
            switch (this.rank) {
                case 0:
                    return 11;
                case 1:
                    return 12;
                default:
                    return this.rank - 2;
            }
        }

        get suit(): Suit {
            if (0 <= this.id && this.id < 13) {
                return Suit.Spades;
            } else if (13 <= this.id && this.id < 26) {
                return Suit.Clubs;
            } else if (26 <= this.id && this.id < 39) {
                return Suit.Diamonds;
            } else if (39 <= this.id && this.id < 52) {
                return Suit.Hearts;
            }
            throw "Illegal id";
        }

        toString(): string {
            return `${this.suit}${this.rank}`;
        }

        moveTo(x: number, y: number, speed: number, callback?) {
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

    export class Position {
        left?: number;
        right?: number;
        top?: number;
        bottom?: number;

        constructor({left, right, top, bottom}: { left?: number, right?: number, top?: number, bottom?: number } = {}) {
            if (left !== undefined && right !== undefined) {
                throw "Can not have left and right prop at the same time."
            } else if (top !== undefined && right !== undefined) {
                throw "Can not have top and bottom prop at the same time."
            }

            this.left = left;
            this.right = right;
            this.top = top;
            this.bottom = bottom;
        }

        get x(): number {
            if (this.left !== undefined) {
                return this.left;
            }
            if (this.right !== undefined) {
                return $(opt.table).width() - this.right;
            }
            return $(opt.table).width() / 2;
        }

        set x(xPos) {
            this.left = xPos;
        }

        get y(): number {
            if (this.top !== undefined) {
                return this.top;
            }
            if (this.bottom !== undefined) {
                return $(opt.table).height() - this.bottom;
            }
            return $(opt.table).height() / 2;
        }

        set y(yPos) {
            this.top = yPos;
        }
    }

    interface ContainerOptions {
        position?: Position;
        angle?: number;
        faceUp?: boolean;
    }

    interface RenderOptions {
        speed?: number;
        immediate?: boolean;
        callback?: Callback<void>;
    }

    export abstract class Container {
        array: Card[];
        position: Position;
        angle: number;
        faceUp: boolean;

        // event handlers
        _click: { func?: Callback<void>, context?};
        _mousedown: { func?: Callback<void>, context?};
        _mouseup: { func?: Callback<void>, context?};

        constructor({position, angle, faceUp}: ContainerOptions = {}) {
            this.array = [];
            this.position = position || new Position();
            this.angle = angle || 0;
            this.faceUp = faceUp;
        }

        abstract calcPosition();

        sort() {
            this.array.sort((a, b) => {
                let compare = a.vcRank - b.vcRank;
                return compare === 0 ? a.suit - b.suit : compare;
            });
        }

        // lowerhand.addCards([12,3,4,5,6].map(cards.Card.fromID)); lowerhand.render()

        addCards(...cards: Card[]) {
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
                    this.array.splice(i, 1)
                    return true;
                }
            }
            return false;
        }


        click(func: Callback<void>, context?: { func, context }) {
            this._click = { func, context };
        }

        mousedown(func: Callback<void>, context?: { func, context }) {
            this._mousedown = { func, context };
        }

        mouseup(func: Callback<void>, context?: { func, context }) {
            this._mouseup = { func, context };
        }

        render({speed, immediate, callback}: RenderOptions = {}) {
            this.sort();
            speed = (speed || opt.animationSpeed);
            this.calcPosition();
            for (let i = 0; i < this.array.length; i++) {
                let card = this.array[i];
                zIndexCounter++;
                card.moveToFront();
                // let top = parseInt($(card.el).css('top'));
                // let left = parseInt($(card.el).css('left'));
                // if (top != card.targetTop || left != card.targetLeft) {
                let props = {
                    top: card.targetPosition.top,
                    left: card.targetPosition.left,
                    queue: false
                };
                if (immediate) {
                    $(card.element).css(props as any);
                } else {
                    $(card.element).animate(props, speed);
                }
                // }
            }
            let me = this;
            let flip = function () {
                for (let i = 0; i < me.array.length; i++) {
                    if (me.faceUp) {
                        me.array[i].showCard();
                    } else {
                        me.array[i].hideCard();
                    }
                }
            }
            if (immediate) {
                flip();
            } else {
                setTimeout(flip, speed / 2);
            }

            if (callback) {
                setTimeout(callback, speed);
            }
        }

        topCard(): Card {
            return this.array[this.array.length - 1];
        }

        toString() {
            return 'Container';
        }
    }

    export class Deck extends Container {
        constructor(options: ContainerOptions = {}) {
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

        toString(): string {
            return 'Deck';
        }

        deal(count: number, hands: Container[], speed: number, callback?) {
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

    export class Hand extends Container {
        constructor(options: ContainerOptions = {}) {
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

    export class Pile extends Container {
        dealCounter: number;

        calcPosition() {
            let left = Math.round(this.position.x - opt.cardSize.width / 2);
            let top = Math.round(this.position.y - opt.cardSize.height / 2);

            for (let i = 0; i < this.array.length; i++) {
                this.array[i].targetPosition = { top, left };
            }
        }

        toString(): string {
            return 'Pile';
        }

        deal(count: number, hands: Container[]) {
            if (!this.dealCounter) {
                this.dealCounter = count * hands.length;
            }
        }
    }
};

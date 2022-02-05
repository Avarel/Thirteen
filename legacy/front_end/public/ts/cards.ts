namespace CardsJS {
    export interface Options {
        cardSize?: { width: number, height: number, padding: number },
        animationSpeed?: number,
        table?: HTMLElement,
        cardBack?: 'red' | 'black',
        cardUrl?: string
    }

    export let opt: Options = {
        cardSize: { width: 80, height: 120, padding: 20 },
        animationSpeed: 150,
        table: document.querySelector<HTMLElement>('body')!,
        cardBack: 'red',
        cardUrl: './assets/img/cards.png'
    };


    let data = new Map<HTMLElement, Card>();

    export function init(options: Options | undefined): void {
        if (options) {
            for (let i in options) {
                if (opt.hasOwnProperty(i) && options[i]) {
                    opt[i] = options[i];
                }
            }
        }

        opt.table!.style.position = 'relative';
    }

    export function newDeck(): Card[] {
        let all = [];
        for (let i = 0; i < 52; i++) {
            all.push(new Card(i));
        }
        return all;
    }

    export enum Suit {
        Spades,
        Clubs,
        Diamonds,
        Hearts
    }

    export class Card {
        faceUp: boolean = false;
        container?: Container;
        targetPosition?: { top: number, left: number };
        hidden: boolean = false;
        element: HTMLElement;

        constructor(public id: number) {
            this.element = document.createElement('div');
            this.element.className = 'card';
            this.element.style.width = `${opt.cardSize!.width}px`;
            this.element.style.height = `${opt.cardSize!.height}px`;
            this.element.style.backgroundImage = `url(${opt.cardUrl})`;
            this.element.style.position = 'absolute';
            this.element.style.cursor = 'pointer';
            this.element.onclick = function (this: HTMLElement, ev: any): void {
                let card: Card = data.get(this)!;
                if (card.container) {
                    let handler = card.container.clickHandler;
                    if (handler) {
                        handler.func.call(handler.context || window, card, ev);
                    }
                }
            }
            data.set(this.element, this);
            opt.table!.appendChild(this.element);
            this.face(false);
        }

        delete() {
            data.delete(this.element);
            this.element.remove();
        }

        static from(suit: Suit, rank: number): Card {
            return new Card(this.calculateID(suit, rank));
        }

        static calculateID(suit: Suit, rank: number): number {
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
            throw new Error('Illegal id');
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
            throw new Error('Illegal id');
        }

        toString(): string {
            return `${this.suit}${this.rank}`;
        }

        moveTo(x: number, y: number, speed: number) {
            if (speed == 0) {
                this.element.style.top = `${y}px`;
                this.element.style.left = `${x}px`;
            } else {
                this.element.style.transition = `all ease-in-out ${speed}ms`;
                this.element.style.top = `${y}px`;
                this.element.style.left = `${x}px`;
                setTimeout(() => {
                    this.element.style.transition = null;
                }, speed);
            }
        }

        rotate(angle: number): void {
            this.element.style.transform = `rotate(${angle}deg)`;
        }

        face(up: boolean): void {
            if (up) {
                let rank = this.rank;

                let xpos = -(rank + 1) * opt.cardSize!.width;
                let ypos = opt.cardSize!.height;
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
            } else {
                let y = opt.cardBack == 'red' ? 0 : -opt.cardSize!.height;
                this.element.style.backgroundPosition = '0px ' + y + 'px';
            }
        }

        display(show: boolean): void {
            if (show) {
                this.hidden = false;
                this.element.style.display = 'block';
            } else {
                this.hidden = true;
                this.element.style.display = 'none';
            }
        }
    }

    // Beautiful isnt it
    type AnchorArgument = {
        left: number
    } | {
            right: number
        } | {
            top: number
        } | {
            bottom: number
        } | {
            cx: number,
        } | {
            cy: number,
        } | {
            cx: number,
            cy: number,
        } | {
            left: number,
            top: number,
        } | {
            left: number,
            bottom: number,
        } | {
            right: number,
            top: number,
        } | {
            right: number,
            bottom: number,
        }

    export class Anchor {
        left?: number;
        right?: number;
        top?: number;
        bottom?: number;
        cx?: number;
        cy?: number;

        constructor(argument: AnchorArgument = { cx: 0, cy: 0 }) {
            if ((argument as { left: number }).left !== undefined) {
                this.left = (argument as { left: number }).left;
            } else if ((argument as { right: number }).right !== undefined) {
                this.right = (argument as { right: number }).right;
            }
            if ((argument as { top: number }).top !== undefined) {
                this.top = (argument as { top: number }).top;
            } else if ((argument as { bottom: number }).bottom !== undefined) {
                this.bottom = (argument as { bottom: number }).bottom;
            }
            if ((argument as { cx: number }).cx !== undefined) {
                this.cx = (argument as { cx: number }).cx;
            }
            if ((argument as { cy: number }).cy !== undefined) {
                this.cy = (argument as { cy: number }).cy;
            }
        }

        get x(): number {
            if (this.left !== undefined) {
                return this.left;
            }
            if (this.right !== undefined) {
                return opt.table!.clientWidth - this.right;
            }
            return opt.table!.clientWidth / 2 + (this.cx || 0);
        }

        set x(xPos) {
            this.left = xPos;
        }

        get y(): number {
            if (this.top !== undefined) {
                return this.top;
            }
            if (this.bottom !== undefined) {
                return opt.table!.clientHeight - this.bottom;
            }
            return opt.table!.clientHeight / 2 + (this.cy || 0);
        }

        set y(yPos) {
            this.top = yPos;
        }
    }

    export interface ContainerOptions {
        readonly position?: Anchor;
        readonly angle?: number;
        readonly faceUp?: boolean;
        readonly hidden?: boolean;
        readonly zIndex?: number;
    }

    export interface RenderOptions {
        readonly speed?: number;
        readonly callback?: (...args: any[]) => void;
    }

    export abstract class Container {
        zIndex: number;
        array: Card[];
        position: Anchor;
        angle: number;
        faceUp: boolean;
        hidden: boolean;

        clickHandler?: { func: (card: Card) => void, context?: any };

        constructor({ position, angle, faceUp, hidden, zIndex }: ContainerOptions = {}) {
            this.array = [];
            this.position = position || new Anchor();
            this.angle = angle || 0;
            this.faceUp = faceUp || false;
            this.hidden = hidden || false;
            this.zIndex = zIndex || 0;
        }

        abstract calcPosition(): void;

        clear(): void {
            this.array.length = 0;
        }

        sort(): void { // stabilize the sort
            let zip: [number, Card][] = [];
            for (let i = 0; i < this.array.length; i++) {
                zip.push([i, this.array[i]])
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

        shuffle(): void {
            let i = this.array.length;
            if (i == 0) return;
            while (--i) {
                let j = Math.floor(Math.random() * (i + 1));
                let tempi = this.array[i];
                let tempj = this.array[j];
                this.array[i] = tempj;
                this.array[j] = tempi;
            }
        }

        draw(n: number, random?: boolean): Card[] {
            if (random) {
                let cards = [];
                for (let i = 0; i < n; i++) {
                    cards.push(this.array.splice(Math.floor(Math.random() * this.array.length), 1)[0]);
                }
                return cards;
            } else {
                return this.array.splice(0, n);
            }
        }

        addCards(...cards: Card[]): void {
            for (let i = 0; i < cards.length; i++) {
                let card = cards[i];
                if (card.container) {
                    card.container.removeCards(card);
                }
                this.array.push(card);
                card.container = this;
            }
        }

        removeCards(...cards: Card[]): Card[] {
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

        removeID(id: number): Card | undefined {
            let i = this.array.findIndex(c => c.id == id);
            return i != -1 ? this.array.splice(i, 1)[0] : undefined;
        }

        topCard(): Card {
            return this.array[this.array.length - 1];
        }

        face(up: boolean): void {
            this.faceUp = up;
        }

        click(func: (card: Card) => void, context?: any): void {
            this.clickHandler = { func, context };
        }

        render({ speed, callback }: RenderOptions = {}): void {
            this.sort();
            speed = (speed || opt.animationSpeed!);
            this.calcPosition();

            let zIndexCounter = this.zIndex * 52;

            for (let i = 0; i < this.array.length; i++) {
                let card = this.array[i];
                card.element.style.zIndex = (zIndexCounter++).toString();
                card.moveTo(card.targetPosition!.left, card.targetPosition!.top, speed);
            }

            let update = () => {
                for (let i = 0; i < this.array.length; i++) {
                    this.array[i].face(this.faceUp);
                }

                this.display(!this.hidden);
            };

            if (speed == 0) {
                update();
            } else {
                setTimeout(update, speed);
            }

            if (callback) {
                setTimeout(callback, speed);
            }
        }

        display(show: boolean): void {
            this.hidden = !show;
            for (let card of this.array) {
                card.display(show);
            }
        }

        toString(): string {
            return 'Container';
        }

        delete(): void {
            for (let card of this.array) {
                card.delete();
            }
            this.array.length = 0;
        }
    }

    export class Deck extends Container {
        constructor(options: ContainerOptions = {}) {
            super(options);
        }

        calcPosition(): void {
            let left = Math.round(this.position.x - opt.cardSize!.width / 2);
            let top = Math.round(this.position.y - opt.cardSize!.height / 2);
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

        deal(count: number, hands: Container[], speed: number, callback?: () => void): void {
            let me = this;
            let i = 0;
            let totalCount = count * hands.length;
            function dealOne(): void {
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

        calcPosition(): void {
            let paddingCount = this.array.length - 1;
            let angle = this.angle * (Math.PI / 180);
            let width = opt.cardSize!.width + paddingCount * opt.cardSize!.padding * Math.cos(angle);
            let height = opt.cardSize!.height - paddingCount * opt.cardSize!.padding * Math.sin(angle);
            let left = Math.round(this.position.x - width / 2);
            let top = Math.round(this.position.y - height / 2);

            for (let i = 0; i < this.array.length; i++) {
                let card = this.array[i];
                card.rotate(this.angle);
                card.targetPosition = {
                    top: top - i * opt.cardSize!.padding * Math.sin(angle),
                    left: left + i * opt.cardSize!.padding * Math.cos(angle)
                };
            }
        }

        toString(): string {
            return 'Hand' + super.toString();
        }
    }

    export class Pile extends Container {
        dealCounter: number = 0;

        calcPosition(): void {
            let left = Math.round(this.position.x - opt.cardSize!.width / 2);
            let top = Math.round(this.position.y - opt.cardSize!.height / 2);

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

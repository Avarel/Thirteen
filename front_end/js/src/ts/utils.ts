declare const $: any;

namespace utils {
    export function debounce(fn: any, timeout: number, invokeAsap?: boolean, ctx?: any): any {
        if (arguments.length == 3 && typeof invokeAsap != 'boolean') {
            ctx = invokeAsap;
            invokeAsap = false;
        }
    
        let timer: any;
    
        return function(this: any) {
            let args = arguments;
            ctx = ctx || this;
    
            invokeAsap && !timer && fn.apply(ctx, args);
    
            clearTimeout(timer);
    
            timer = setTimeout(function() {
                !invokeAsap && fn.apply(ctx, args);
                timer = undefined;
            }, timeout);
        };
    }

    export function cardRange(start: number, end: number): cards.Card[] {
        let array: cards.Card[] = [];

        for (let i = start; i < end; i++) {
            array.push(cards.Card.fromID(i));
        }

        return array;
    }

    export function cardsFromID(...id: number[]): cards.Card[] {
        return id.map(cards.Card.fromID);
    }
}


"use strict";
var utils;
(function (utils) {
    function debounce(fn, timeout, invokeAsap, ctx) {
        if (arguments.length == 3 && typeof invokeAsap != 'boolean') {
            ctx = invokeAsap;
            invokeAsap = false;
        }
        let timer;
        return function () {
            let args = arguments;
            ctx = ctx || this;
            invokeAsap && !timer && fn.apply(ctx, args);
            clearTimeout(timer);
            timer = setTimeout(function () {
                !invokeAsap && fn.apply(ctx, args);
                timer = undefined;
            }, timeout);
        };
    }
    utils.debounce = debounce;
    function cardRange(start, end) {
        let array = [];
        for (let i = start; i < end; i++) {
            array.push(cards.Card.fromID(i));
        }
        return array;
    }
    utils.cardRange = cardRange;
    function cardsFromID(...id) {
        return id.map(cards.Card.fromID);
    }
    utils.cardsFromID = cardsFromID;
})(utils || (utils = {}));

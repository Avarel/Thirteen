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
            timer = setTimeout(() => {
                !invokeAsap && fn.apply(ctx, args);
                timer = undefined;
            }, timeout);
        };
    }
    utils.debounce = debounce;
    function rotate(source, shift) {
        let array = [];
        for (let i = 0; i < source.length; i++) {
            array.push(source[(i + shift) % source.length]);
        }
        return array;
    }
    utils.rotate = rotate;
})(utils || (utils = {}));

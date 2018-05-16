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
        if (shift == -1) {
            throw new Error("negative shift");
        }
        let array = [];
        for (let i = 0; i < source.length; i++) {
            array.push(source[(i + shift) % source.length]);
        }
        return array;
    }
    utils.rotate = rotate;
    const firstName = ['Awesome', 'Big', 'Small', 'Smart', 'Good', 'Great', 'Adorable', 'Fancy', 'Witty', 'Fast', 'Eager', 'Nice', 'Lively', 'Gifted', 'Red', 'Cute', 'Clever', 'Crazy', 'Calm', 'Cunning'];
    const lastName = ['Dog', 'Cat', 'Lion', 'Eagle', 'Bird', 'Panda', 'Fish', 'Bear', 'Hedgehog', 'Quail', 'Chicken', 'Ant', 'Bug', 'Beetle', 'Zebra', 'Horse'];
    function randomName() {
        return randomElement(firstName) + ' ' + randomElement(lastName);
    }
    utils.randomName = randomName;
    function randomElement(array) {
        return array[Math.floor(Math.random() * array.length)];
    }
    utils.randomElement = randomElement;
})(utils || (utils = {}));

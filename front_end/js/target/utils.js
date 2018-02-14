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
            timer = null;
        }, timeout);
    };
}

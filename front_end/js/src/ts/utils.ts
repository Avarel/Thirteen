function debounce(fn: any, timeout: number, invokeAsap?: boolean, ctx?: any): any {
    if (arguments.length == 3 && typeof invokeAsap != 'boolean') {
        ctx = invokeAsap;
        invokeAsap = false;
    }

    let timer: any;

    return function() {
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

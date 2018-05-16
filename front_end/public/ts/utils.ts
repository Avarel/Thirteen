namespace utils {
    export function debounce(fn: any, timeout: number, invokeAsap?: boolean, ctx?: any): any {
        if (arguments.length == 3 && typeof invokeAsap != 'boolean') {
            ctx = invokeAsap;
            invokeAsap = false;
        }

        let timer: any;
        return function (this: any) {
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

    export function rotate<T>(source: T[], shift: number): T[] {
        if (shift == -1) {
            throw new Error("negative shift");
        }

        let array = [];

        for (let i = 0; i < source.length; i++) {
            array.push(source[(i + shift) % source.length]);
        }

        return array
    }

    const firstName = ['Awesome', 'Big', 'Small', 'Smart', 'Good', 'Great', 'Adorable', 'Fancy', 'Witty', 'Fast', 'Eager', 'Nice', 'Lively', 'Gifted', 'Red', 'Cute', 'Clever', 'Crazy', 'Calm', 'Cunning'];
    const lastName = ['Dog', 'Cat', 'Lion', 'Eagle', 'Bird', 'Panda', 'Fish', 'Bear', 'Hedgehog', 'Quail', 'Chicken', 'Ant', 'Bug', 'Beetle', 'Zebra', 'Horse'];

    export function randomName(): string {
        return randomElement(firstName) + ' ' + randomElement(lastName);
    }

    export function randomElement<T>(array: T[]): T {
        return array[Math.floor(Math.random() * array.length)];
    }
}
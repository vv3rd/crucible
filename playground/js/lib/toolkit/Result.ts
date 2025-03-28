type O = object;
export type Result<T extends O, E extends O> = Result.Ok<T> | Result.Err<E>;

export namespace Result {
    const OK = Symbol();
    const ERR = Symbol();
    const TAG = Symbol();

    export type Ok<T extends O> = { [TAG]: typeof OK } & T;

    export type Err<E extends O> = { [TAG]: typeof ERR } & E;

    export const isOk = <T extends O, E extends O>(r: Result<T, E>): r is Ok<T> => r[TAG] === OK;
    export const isErr = <T extends O, E extends O>(r: Result<T, E>): r is Err<E> => r[TAG] === ERR;

    const create = <T>(thing: T, tag: typeof OK | typeof ERR) =>
        withPrototype(thing, { [TAG]: tag });

    export const ok = <T extends O>(thing: T): Ok<T> => create(thing, OK);
    export const err = <T extends O>(thing: T): Err<T> => create(thing, ERR);
}

function withPrototype(thing: any, proto: any) {
    return setPrototypeOf(thing, setPrototypeOf(proto, getPrototypeOf(thing)));
}

const { setPrototypeOf, getPrototypeOf } = Object;

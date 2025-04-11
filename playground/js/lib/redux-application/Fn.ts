export type Fn<TParams extends any[] = [], TReturn = void, TThis = void> = (
    this: TThis,
    ...params: TParams
) => TReturn;

export declare namespace Fn {
    type Like<func extends AnyFn, but extends { returns?: any; accepts?: any[] }> = (
        ...args: but extends { accepts: {}[] } ? but["accepts"] : Parameters<func>
    ) => but extends { returns: {} } ? but["returns"] : ReturnType<func>;
}

export type AnyFn = (...args: any[]) => any;

export type Fn1<P, TReturn = void> = (param: P) => TReturn;
export type Fn2<P1, P2, TReturn = void> = (param1: P1) => (param2: P2) => TReturn;
export type Fn3<P1, P2, P3, TReturn = void> = (
    param1: P1,
) => (param2: P2) => (param3: P3) => TReturn;

export type VoidFn = () => void;
export type Get<TReturn> = () => TReturn;
export type Lazy<T> = T | Get<T>;

export type Is<T> = (thing: unknown) => thing is T;

export type Narrow<From, To extends From> = (input: From) => input is To;

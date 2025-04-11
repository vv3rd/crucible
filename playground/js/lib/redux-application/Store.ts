import { Reducer } from "./Reducer";
import { Task, TaskOfStore } from "./Task";
import { FUCK_STORE_LOCKED } from "./Errors.ts";
import { Msg, SomeMsg } from "./Message.ts";

export namespace Store {
    export const create = createStore;
    export const scoped = createScopedStore;
}

export interface Store<TState> {
    dispatch: Dispatch;
    getState: () => TState;

    // TODO: consider if it is worth adding, and if so, how?
    // context: TCtx;

    subscribe: (callback?: ListenerCallback) => MsgStream<TState>;
    unsubscribe: (callback: ListenerCallback) => void;

    execute: <T>(task: TaskOfStore<T, this>) => T;
    catch: (...errors: unknown[]) => void;
}

interface MsgStreamBase extends Disposable, AsyncIterable<Msg> {
    unsubscribe: () => void;
    addTeardown: (teardown: () => void) => void;
    nextMessage: () => Promise<Msg>;
    lastMessage: () => Msg;
}

interface MsgStream<TState> extends MsgStreamBase {
    query: MsgStreamQuery<TState>;
}

export interface ListenerCallback {
    (): void;
}
export interface Listener {
    notify: ListenerCallback;
    cleanups: Array<() => void>;
}

export interface Dispatch<TMsg = SomeMsg> {
    (action: TMsg): void;
}

type StoreOverlay = (creator: StoreCreator) => StoreCreator;

type StoreCreator = <TState>(reducer: Reducer<TState>, final: () => Store<TState>) => Store<TState>;

export type AnyStore = Store<any>;

const noop = () => {};
const same = <T>(thing: T): T => thing;

function createStore<TState>(
    reducer: Reducer<TState>,
    { overlay = same }: { overlay?: StoreOverlay } = {},
) {
    const store: Store<TState> = overlay(createStoreImpl)(reducer, () => store);
    return store;
}

const createStoreImpl: StoreCreator = (reducer, final) => {
    type TState = Reducer.InferState<typeof reducer>;
    type TMsg = Msg;
    type TSelf = Store<TState>;

    let state: TState = Reducer.initialize(reducer);
    let lastMsg: TMsg;
    let nextMsg: PromiseWithResolvers<TMsg> = Promise.withResolvers();

    const listeners = new Map<ListenerCallback, Listener>();

    const activeStore: TSelf = {
        getState() {
            return state;
        },

        dispatch(msg) {
            if (msg == null) {
                return;
            }
            const taskPool = Task.pool<void, TState>();
            try {
                delegate = lockedStore;
                state = reducer(state, msg, taskPool.getScheduler());
            } finally {
                delegate = activeStore;
                taskPool.lockScheduler();
            }
            lastMsg = msg;
            nextMsg.resolve(msg);
            nextMsg = Promise.withResolvers();

            const self = final();
            const errs: unknown[] = [];
            // biome-ignore format:
            for (const {notify} of listeners.values()) try { notify() } catch (e) { errs.push(e) }
            // biome-ignore format:
            for (const task of taskPool) try { self.execute(task) } catch (e) { errs.push(e) }
            if (errs.length) {
                self.catch(...errs);
            }
        },

        subscribe(callback = noop) {
            const self = final();
            let listener = listeners.get(callback);
            if (listener === undefined) {
                listener = {
                    notify: callback,
                    cleanups: [],
                };
                listeners.set(callback, listener);
            }
            const unsubscribe = () => self.unsubscribe(callback);
            const base: MsgStreamBase = {
                addTeardown: (fn) => listener.cleanups.push(fn),
                lastMessage: () => lastMsg,
                nextMessage: () => nextMsg.promise,
                unsubscribe: unsubscribe,
                [Symbol.dispose]: unsubscribe,
                [Symbol.asyncIterator]: () => MsgStreamIterator.create(base.nextMessage),
            };
            const stream: MsgStream<TState> = {
                ...base,
                query: MsgStreamQuery.create(base, self),
            };
            return stream;
        },

        unsubscribe(callback) {
            const listener = listeners.get(callback);
            if (listener) {
                listeners.delete(callback);
                listener.cleanups.forEach((fn) => fn());
            }
        },

        execute(task) {
            const ac = new AbortController();
            const abort = ac.abort.bind(ac);
            const self = createTemporaryStore(final(), ac.signal);
            try {
                const out = task(self, ac.signal);
                if (out instanceof Promise) {
                    out.finally(abort);
                }
                return out;
            } finally {
                abort();
            }
        },

        catch(...errors) {
            for (const error of errors) {
                reportError(error);
            }
        },
    };

    let delegate: TSelf = activeStore;

    // biome-ignore format: saves space
    const lockedStore: TSelf = {
        dispatch() { throw new Error(FUCK_STORE_LOCKED); },
        execute() { throw new Error(FUCK_STORE_LOCKED); },
        catch() { throw new Error(FUCK_STORE_LOCKED); },
        getState() { throw new Error(FUCK_STORE_LOCKED); },
        subscribe() { throw new Error(FUCK_STORE_LOCKED); },
        unsubscribe() { throw new Error(FUCK_STORE_LOCKED); },
    };

    // biome-ignore format: better visual
    return {
		dispatch:    (...a) => delegate.dispatch(...a),
		execute:     (...a) => delegate.execute(...a),
		catch:       (...a) => delegate.catch(...a),
		getState:        () => delegate.getState(),
		subscribe:   (...a) => delegate.subscribe(...a),
		unsubscribe: (...a) => delegate.unsubscribe(...a),
	};
};

function createTemporaryStore<TState>(base: Store<TState>, signal: AbortSignal): Store<TState> {
    const subscribe = (listener?: ListenerCallback) => {
        const stream = base.subscribe(listener);
        signal.addEventListener("abort", stream.unsubscribe);
        const nextMessage = () => {
            const aborted = new Promise<never>((_, reject) =>
                signal.addEventListener("abort", reject),
            );
            const resolved = stream.nextMessage();
            return Promise.race([aborted, resolved]);
        };
        return {
            ...stream,
            nextMessage: nextMessage,
            [Symbol.asyncIterator]: () => MsgStreamIterator.create(nextMessage),
        };
    };
    return { ...base, subscribe: subscribe };
}

function createScopedStore<TStateA, TStateB>(
    base: Store<TStateA>,
    selector: (state: TStateA) => TStateB,
): Store<TStateB> {
    const self: Store<TStateB> = {
        ...base,
        getState() {
            return selector(base.getState());
        },
        execute(task) {
            return base.execute((_, signal) => task(self, signal));
        },
        subscribe(listener) {
            const stream = base.subscribe(listener);
            return {
                ...stream,
                query: MsgStreamQuery.create(stream, self),
            };
        },
    };
    return self;
}

interface MsgStreamIterator {
    next(): Promise<IteratorResult<Msg, void>>;
}
namespace MsgStreamIterator {
    export function create(nextMessage: () => Promise<Msg>): MsgStreamIterator {
        return {
            async next() {
                try {
                    return { value: await nextMessage() };
                } catch {
                    return { done: true, value: undefined };
                }
            },
        };
    }
}

interface MsgStreamQuery<TState> {
    (checker: (state: TState) => boolean): Promise<TState>;
    <U extends TState>(predicate: (state: TState) => state is U): Promise<U>;
    <T>(selector: (state: TState) => T | null | undefined | false): Promise<T>;
    <M extends Msg>(matcher: Msg.Matcher<M>): Promise<M>;
}
namespace MsgStreamQuery {
    export function create<TState>(
        { nextMessage }: Pick<MsgStreamBase, "nextMessage">,
        { getState }: Pick<Store<TState>, "getState">,
    ): MsgStreamQuery<TState> {
        return async function query(arg: any) {
            if ("match" in arg) {
                const matcher = arg;

                let awaitedMessage: Msg | undefined;
                while (awaitedMessage === undefined) {
                    const msg = await nextMessage();
                    if (matcher.match(msg)) {
                        awaitedMessage = msg;
                    }
                }
                return awaitedMessage;
            } else {
                const checker = arg;

                let state = getState();
                let check = checker(state);
                while (check == null || check === false) {
                    await nextMessage();
                    state = getState();
                    check = checker(state);
                }
                if (typeof check === "boolean") {
                    return state;
                } else {
                    return check;
                }
            }
        };
    }
}

import { Reducer } from "./Reducer";
import { Task, TaskOfStore } from "./Task";
import { doNothing, identity, tryCatch } from "../toolkit";
import { FUCK_STORE_LOCKED, FUCK_TASK_EXITED } from "./Errors.ts";
import { AnyFn, VoidFn } from "./Fn.ts";
import { Msg } from "./Message.ts";

export namespace Store {
    export const create = createStore;
    export const scoped = createScopedStore;
}

export interface Store<TState, TMsg extends Msg> {
    dispatch: Dispatch<TMsg>;
    getState: () => TState;

    // TODO: consider if it is worth adding, and if so, how?
    // context: {};

    subscribe: (listener?: ListenerCallback) => MsgStream<TState, TMsg>;
    unsubscribe: (listener: AnyFn) => void;

    execute: <T>(task: TaskOfStore<this, T>) => T;
    catch: (...errors: unknown[]) => void;
}

interface MsgStreamBase<TMsg extends Msg> extends Disposable, AsyncIterable<TMsg> {
    unsubscribe(): void;
    addTeardown(teardown: VoidFn): void;
    nextMessage: () => Promise<TMsg>;
    lastMessage: () => TMsg;
}

interface MsgStream<TState, TMsg extends Msg> extends MsgStreamBase<TMsg> {
    query: MsgStreamQuery<TState>;
}

export interface ListenerCallback {
    (): void;
}
export interface Listener {
    notify: ListenerCallback;
    cleanups: Array<() => void>;
}

export interface Dispatch<TMsg> {
    (action: TMsg): void;
}

type StoreOverlay = (creator: InnerStoreCreator) => InnerStoreCreator;

type InnerStoreCreator = <TState, TMsg extends Msg>(
    reducer: Reducer<TState, TMsg>,
    getFinalStore: () => Store<TState, TMsg>,
) => Store<TState, TMsg>;

export function createStore<TState, TMsg extends Msg>(
    reducer: Reducer<TState, TMsg>,
    overlay: StoreOverlay = identity,
) {
    const store: Store<TState, TMsg> = overlay(createStoreImpl)(reducer, () => store);
    return store;
}

const createStoreImpl: InnerStoreCreator = (reducer, getFinalStore) => {
    type TState = Reducer.InferState<typeof reducer>;
    type TMsg = Reducer.InferMsg<typeof reducer>;

    let state: TState = Reducer.initialize(reducer);

    const listeners = new Map<ListenerCallback, Listener>();

    const activeStore: Store<TState, TMsg> = {
        getState() {
            return state;
        },

        dispatch(msg) {
            if (msg == null) {
                return;
            }
            const taskPool = Task.pool<void, TState, TMsg>();
            try {
                delegate = lockedStore;
                state = reducer(state, msg, taskPool.getScheduler());
            } finally {
                delegate = activeStore;
                taskPool.lockScheduler();
            }
            lastMsg = msg;

            const self = getFinalStore();
            const errs: unknown[] = [];
            // biome-ignore format:
            for (const listener of listeners.values()) try { listener.notify() } catch (e) { errs.push(e) }
            // biome-ignore format:
            for (const task of taskPool) try { self.execute(task) } catch (e) { errs.push(e) }
            if (errs.length) {
                self.catch(...errs);
            }
        },

        subscribe(callback = doNothing) {
            const self = getFinalStore();
            const listener: Listener | undefined = listeners.get(callback) ?? {
                notify: callback,
                cleanups: [],
            };
            if (!listeners.has(callback)) {
                listeners.set(callback, listener);
            }

            const unsubscribe = () => self.unsubscribe(callback);
            const base: MsgStreamBase<TMsg> = {
                addTeardown: (fn) => listener.cleanups.push(fn),
                lastMessage: () => lastMsg,
                nextMessage: () => nextMsg ?? (nextMsg = new Promise(setupForNextMessage)),
                unsubscribe: unsubscribe,
                [Symbol.dispose]: unsubscribe,
                [Symbol.asyncIterator]: () => MsgStreamIterator.create(base.nextMessage),
            };
            const stream: MsgStream<TState, TMsg> = {
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
            let self = getFinalStore();
            self = {
                ...self,
                subscribe(listener) {
                    const stream = self.subscribe(listener);
                    ac.signal.addEventListener("abort", stream.unsubscribe);
                    return stream;
                },
            };
            return tryCatch(() => task(self, ac.signal), {
                finally: () => ac.abort(),
            });
        },

        catch(...errors) {
            for (const error of errors) {
                reportError(error);
            }
        },
    };

    let lastMsg: TMsg;
    let nextMsg: Promise<TMsg> | undefined;
    const setupForNextMessage = (
        resolve: (msg: TMsg) => void,
        reject: (reason: unknown) => void,
    ) => {
        const { addTeardown, unsubscribe } = delegate.subscribe(() => {
            nextMsg = undefined;
            unsubscribe();
            resolve(lastMsg);
        });
        addTeardown(() => {
            reject(new Error(FUCK_TASK_EXITED));
        });
    };

    let delegate: Store<TState, TMsg> = activeStore;

    // biome-ignore format: saves space
    const lockedStore: Store<TState, TMsg> = {
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

function createScopedStore<TStateA, TStateB, TMsg extends Msg>(
    base: Store<TStateA, TMsg>,
    selector: (state: TStateA) => TStateB,
): Store<TStateB, TMsg> {
    const self: Store<TStateB, TMsg> = {
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

interface MsgStreamIterator<TMsg extends Msg> {
    next(): Promise<IteratorResult<TMsg, void>>;
}
namespace MsgStreamIterator {
    export function create<TMsg extends Msg>(
        nextMessage: () => Promise<TMsg>,
    ): MsgStreamIterator<TMsg> {
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
    export function create<TState, TMsg extends Msg>(
        { nextMessage }: Pick<MsgStreamBase<TMsg>, "nextMessage">,
        { getState }: Pick<Store<TState, TMsg>, "getState">,
    ): MsgStreamQuery<TState> {
        return async function query(arg: any) {
            if ("match" in arg) {
                const matcher = arg;

                let awaitedMessage: TMsg | undefined;
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

import { Reducer } from "./Reducer";
import { Task } from "./Task";
import { identity, tryCatch } from "../toolkit";
import { FUCK_STORE_LOCKED, FUCK_TASK_EXITED } from "./Errors.ts";
import { AnyFn, VoidFn } from "./Fn.ts";
import { Msg } from "./Message.ts";

export interface Store<TState, TMsg extends Msg> {
    dispatch: Dispatch<TMsg>;
    getState: () => TState;
    subscribe: (listener: ListenerCallback) => Subscription;
    unsubscribe: (listener: AnyFn) => void;

    execute: <T>(task: Task<T, TState, TMsg>) => T;
    catch: (...errors: unknown[]) => void;

    nextMessage: () => Promise<Msg>;
    lastMessage: () => TMsg;
}

export interface Subscription extends Disposable {
    addCleanup(teardown: VoidFn): void;
    (): void;
}

export interface MsgStream<TState, TMsg extends Msg> extends Subscription, AsyncIterator<TMsg> {
    nextMessage: () => Promise<TMsg>;
    lastMessage: () => TMsg;
    condition<U extends TState>(checker: (state: TState) => state is U): Promise<U>;
    condition(checker: (state: TState) => boolean): Promise<TState>;
    take<T extends Msg>(matcher: Msg.Matcher<T>): Promise<T>;
}

export interface ListenerCallback {
    (): void;
}
export interface Listener {
    notify: ListenerCallback;
    cleanups: Array<() => void>
}

export interface Dispatch<TMsg> {
    (action: TMsg): void;
}

type StoreOverlay = (creator: InnerStoreCreator) => InnerStoreCreator;

type InnerStoreCreator = <TState, TMsg extends Msg>(
    reducer: Reducer<TState, TMsg>,
    getFinalStore: () => Store<TState, TMsg>,
) => Store<TState, TMsg>;

export namespace Store {
    export const create = createStore;

    export const scoped = <TStateA, TStateB, TMsg extends Msg>(
        base: Store<TStateA, TMsg>,
        selector: (state: TStateA) => TStateB,
    ): Store<TStateB, TMsg> => {
        const self: Store<TStateB, TMsg> = {
            ...base,
            getState: () => selector(base.getState()),
            execute: (task) => base.execute((_, signal) => task(self, signal)),
        };
        return self;
    };
}

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
        getState() {
            return state;
        },
        subscribe(callback) {
            const self = getFinalStore()
            const listener: Listener = { notify: callback, cleanups: [] }
            const unsub: Subscription = () => self.unsubscribe(callback);
            unsub.addCleanup = cleanup => listener.cleanups.push(cleanup);
            unsub[Symbol.dispose] = unsub;
            listeners.set(callback, listener);
            return unsub;
        },
        unsubscribe(callback) {
            const listener = listeners.get(callback);
            if (listener) {
                listeners.delete(callback)
                listener.cleanups.forEach(fn => fn())
            }
        },

        execute(task) {
            const ac = new AbortController();
            let self = getFinalStore();
            self = {
                ...self,
                subscribe(listener) {
                    const unsubscribe = self.subscribe(listener);
                    ac.signal.addEventListener("abort", unsubscribe);
                    return unsubscribe;
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

        lastMessage() {
            return lastMsg;
        },
        nextMessage() {
            return nextMsg ?? (nextMsg = new Promise(setupPromise));
        },
    };

    let lastMsg: TMsg;
    let nextMsg: Promise<TMsg> | undefined;
    const setupPromise = (resolve: (msg: TMsg) => void, reject: (reason: unknown) => void) => {
        const unsubscribe = delegate.subscribe(() => {
            nextMsg = undefined;
            unsubscribe();
            resolve(lastMsg);
        });
        unsubscribe.addCleanup(() => {
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
        nextMessage() { throw new Error(FUCK_STORE_LOCKED); },
        lastMessage() { throw new Error(FUCK_STORE_LOCKED); }
    };

    // biome-ignore format: better visual
    return {
		dispatch:    (...a) => delegate.dispatch(...a),
		execute:     (...a) => delegate.execute(...a),
		catch:       (...a) => delegate.catch(...a),
		getState:        () => delegate.getState(),
		subscribe:   (...a) => delegate.subscribe(...a),
		unsubscribe: (...a) => delegate.unsubscribe(...a),
		lastMessage:     () => delegate.lastMessage(),
		nextMessage:     () => delegate.nextMessage(),
	};
};

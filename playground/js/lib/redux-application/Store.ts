import { Reducer } from "./Reducer";
import { Task } from "./Task";
import { identity, tryCatch } from "../toolkit";
import { FUCK_STORE_LOCKED, FUCK_TASK_EXITED } from "./Errors.ts";
import { AnyFn, VoidFn } from "./Fn.ts";
import { Msg } from "./Message.ts";

export interface Subscription extends Disposable {
    addTeardown(teardown: VoidFn): void;
    (): void;
}

export interface ListenerCallback<TMsg> {
    (notifier: { lastMessage: () => TMsg }): void;
}

export interface Store<TState, TMsg extends Msg> {
    dispatch: Dispatch<TMsg>;
    getState: () => TState;
    subscribe: (listener: ListenerCallback<TMsg>) => Subscription;
    unsubscribe: (listener: AnyFn) => void;

    execute: <T>(task: Task<T, TState, TMsg>) => T;
    catch: (...errors: unknown[]) => void;

    nextMessage: () => Promise<Msg>;
    lastMessage: () => TMsg;
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

    const listeners: Set<ListenerCallback<TMsg>> = new Set();

    const activeStore: Store<TState, TMsg> = {
        dispatch(msg) {
            if (msg == null) {
                return;
            }
            const tasks = Task.pool<void, TState, TMsg>();
            try {
                delegate = lockedStore;
                state = reducer(state, msg, tasks.getScheduler());
            } finally {
                delegate = activeStore;
                tasks.lockScheduler();
            }
            lastMsg = msg;

            const finalStore = getFinalStore();
            const errors: unknown[] = [];
            for (const task of [...listeners, ...tasks]) {
                try {
                    finalStore.execute(task);
                } catch (err) {
                    errors.push(err);
                }
            }
            if (errors.length) {
                finalStore.catch(...errors);
            }
        },
        getState() {
            return state;
        },
        subscribe(listener) {
            listeners.add(listener);
            const teardowns = [() => delegate.unsubscribe(listener)];
            const unsubscribe = () => teardowns.forEach((teardown) => teardown());
            unsubscribe.addTeardown = teardowns.push.bind(teardowns);
            unsubscribe[Symbol.dispose] = unsubscribe;
            return unsubscribe;
        },
        unsubscribe(listener) {
            listeners.delete(listener);
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
            const out = tryCatch(() => task(self, ac.signal), {
                finally: () => ac.abort(),
            });
            return out;
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
        const unsubscribe = delegate.subscribe(({ lastMessage }) => {
            nextMsg = undefined;
            unsubscribe();
            resolve(lastMessage());
        });
        unsubscribe.addTeardown(() => {
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

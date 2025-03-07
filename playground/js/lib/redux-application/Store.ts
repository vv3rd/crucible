import { Message, AnyMessage } from "./types";
import { Reducer } from "./Reducer";
import { Task } from "./Task";
import { identity } from "../toolkit";
import { FUCK_INTERNALS_USED, FUCK_STORE_LOCKED } from "./Errors.ts";
import { Msg } from "./Message.ts";
import { AnyFn, Lazy } from "./Fn.ts";

export interface Subscription {
	// extends Disposable {
	// unsubscribe(): void;
	(): void;
}

export interface ListenerCallback {
	(notifier: { lastMessage: () => AnyMessage }): void;
}

export interface Store<TState, TMsg extends Message> {
	dispatch: Dispatch<TMsg>;
	getState: () => TState;
	subscribe: (listener: ListenerCallback) => Subscription;
	unsubscribe: (listener: AnyFn) => void;
	nextMessage: () => Promise<AnyMessage>;
	lastMessage: () => AnyMessage;
}

export interface Dispatch<TMsg> {
	(action: TMsg): void;
}

type StoreOverlay = (creator: InnerStoreCreator) => InnerStoreCreator;

type InnerStoreCreator = <TState, TMsg extends Message>(
	reducer: Reducer<TState, TMsg>,
	internals: Internals<TState, TMsg>,
) => Store<TState, TMsg>;

type Internals<TState, TMsg extends Message> = {
	tasksExecutor: Executor<TState, TMsg>;
	storeAccessor: () => Store<TState, TMsg>;
};

type Executor<TState, TMsg extends Message> = (
	tasks: Array<Task<TState, void>>,
	store: Lazy<Store<TState, TMsg>>,
) => void;

export const createStore = <TState, TMsg extends Message>(
	reducer: Reducer<TState, TMsg>,
	overlay: StoreOverlay = identity,
): Store<TState, TMsg> => {
	let storeAccessor = (): typeof store => {
		try {
			return store;
		} catch (error) {
			throw new Error(FUCK_INTERNALS_USED, { cause: error });
		}
	};
	const store: Store<TState, TMsg> = overlay(createStoreImpl)(reducer, {
		storeAccessor: () => storeAccessor(),
		tasksExecutor: defaultExecutor,
	});
	storeAccessor = () => store;
	return store;
};

const createStoreImpl: InnerStoreCreator = (reducer, internals) => {
	type TState = Reducer.InferState<typeof reducer>;
	type TMsg = Reducer.InferMsg<typeof reducer>;
	const {
		//
		tasksExecutor: executeTasks,
		storeAccessor: getFinalStore,
	} = internals;
	const listeners: Set<ListenerCallback> = new Set();

	let state: TState = Reducer.initialize(reducer);

	const activeStore: Store<TState, TMsg> = {
		dispatch(msg) {
			const tpb = Task.pool<TState, void>();
			try {
				delegate = lockedStore;
				state = reducer(state, msg, tpb.getScheduler());
			} finally {
				delegate = activeStore;
				tpb.lockScheduler();
			}
			lastMsg = msg;
			executeTasks([...listeners], getFinalStore);
			executeTasks(tpb.getTasks(), getFinalStore);
		},

		subscribe(listener) {
			listeners.add(listener);
			const unsubscribe = () => delegate.unsubscribe(listener);
			return unsubscribe;
		},
		unsubscribe(listener) {
			listeners.delete(listener);
		},
		getState() {
			return state;
		},
		lastMessage() {
			return lastMsg;
		},
		nextMessage() {
			return nextMsg ?? (nextMsg = new Promise(setupPromise));
		},
	};

	let lastMsg = Msg.empty();
	let nextMsg: Promise<AnyMessage> | undefined;
	const setupPromise = (resolve: (msg: AnyMessage) => void) => {
		const unsubscribe = delegate.subscribe(({ lastMessage }) => {
			nextMsg = undefined;
			unsubscribe();
			resolve(lastMessage());
		});
	};

	let delegate: Store<TState, TMsg> = activeStore;

	// biome-ignore format: better visual
	return {
		dispatch:    (...a) => delegate.dispatch(...a),
		getState:        () => delegate.getState(),
		subscribe:   (...a) => delegate.subscribe(...a),
		unsubscribe: (...a) => delegate.unsubscribe(...a),
		lastMessage:     () => delegate.lastMessage(),
		nextMessage:     () => delegate.nextMessage(),
	};
};

// biome-ignore format: saves space
const lockedStore: Store<any, any> = {
    dispatch() { throw new Error(FUCK_STORE_LOCKED); },
    getState() { throw new Error(FUCK_STORE_LOCKED); },
    subscribe() { throw new Error(FUCK_STORE_LOCKED); },
    unsubscribe() { throw new Error(FUCK_STORE_LOCKED); },
    nextMessage() { throw new Error(FUCK_STORE_LOCKED); },
    lastMessage() { throw new Error(FUCK_STORE_LOCKED); }
};

const defaultExecutor: Executor<any, any> = (tasks, getStore) => {
	const onError = console.error;
	const errors: unknown[] = [];
	const store = getStore();
	for (const func of tasks) {
		try {
			Task.run(func, store);
		} catch (err) {
			errors.push(err);
		}
	}
	for (const error of errors) {
		onError(error);
	}
};

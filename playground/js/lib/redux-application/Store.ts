import { Message, Store, ListenerCallback } from "./types";
import { Reducer } from "./Reducer";
import { TaskApi, TaskFn } from "./Task";
import { identity } from "../toolkit";
import { FUCK_INTERNALS_USED, FUCK_STORE_LOCKED } from "./Errors.ts";

type WrappableStoreCreator<
	TState,
	TMsg extends Message,
> = typeof createStoreIml<TState, TMsg>;

type StoreOverlay<TState, TMsg extends Message> = (
	creator: WrappableStoreCreator<TState, TMsg>,
) => WrappableStoreCreator<TState, TMsg>;

export function createStore<TState, TMsg extends Message>(
	reducer: Reducer<TState, TMsg>,
	overlay: StoreOverlay<TState, TMsg> = identity,
): Store<TState, TMsg> {
	let storeAccessor = (): typeof store => {
		try {
			return store;
		} catch (error) {
			throw new Error(FUCK_INTERNALS_USED, { cause: error });
		}
	};
	let tasksExecutor: Executor = () => {
		throw new Error(FUCK_INTERNALS_USED);
	};
	const store: Store<TState, TMsg> = overlay(createStoreIml)(reducer, {
		storeAccessor: () => storeAccessor(),
		tasksExecutor: (f, p) => tasksExecutor(f, p),
	});
	storeAccessor = () => store;
	tasksExecutor = defaultExecutor;
	return store;
}

// declare const testTask: TaskFn<any, any, { foo: "test" }>;

export function createStoreIml<TState, TMsg extends Message>(
	reducer: Reducer<TState, TMsg>,
	internals: Internals<TState, TMsg>,
): Store<TState, TMsg> {
	const {
		//
		tasksExecutor: executeTasks,
		storeAccessor: getFinalStore,
	} = internals;
	const listeners: Set<ListenerCallback<TMsg>> = new Set();
	const getTaskApi = () => TaskApi.fromStore(getFinalStore());

	let state: TState = Reducer.initialize(reducer);

	const activeStore: Store<TState, TMsg> = {
		dispatch(msgOrTask: Message<any> | TaskFn<TState, any>) {
			if (typeof msgOrTask === "function") {
				const task = msgOrTask;
				return executeTasks([task], getTaskApi);
			}
			const msg = msgOrTask as TMsg;
			const tpb = TaskFn.pool<TState, void>();
			try {
				delegate = lockedStore;
				state = reducer(state, msg, tpb.getScheduler());
			} finally {
				delegate = activeStore;
				tpb.lockScheduler();
			}
			executeTasks([...listeners], msg);
			executeTasks(tpb.getTasks(), getTaskApi);
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
	};

	let delegate: Store<TState, TMsg> = activeStore;

	// biome-ignore format: better visual
	return {
		dispatch: (action: any) => delegate.dispatch(action),
		getState:            () => delegate.getState(),
		subscribe:   (callback) => delegate.subscribe(callback),
		unsubscribe: (callback) => delegate.unsubscribe(callback),
	};
}

// biome-ignore format: saves space
const lockedStore: Store<any, any> = {
	dispatch() { throw new Error(FUCK_STORE_LOCKED); },
	getState() { throw new Error(FUCK_STORE_LOCKED); },
	subscribe() { throw new Error(FUCK_STORE_LOCKED); },
	unsubscribe() { throw new Error(FUCK_STORE_LOCKED); },
};

type Internals<TState, TMsg extends Message> = {
	tasksExecutor: Executor;
	storeAccessor: () => Store<TState, TMsg>;
};

type Executor = <A, Fs extends Array<(arg: A) => any>>(
	funcs: Fs,
	param: A | (() => A),
) => ReturnType<Fs[0]>;

const defaultExecutor: Executor = (funcs, param) => {
	const onError = console.error;
	if (param instanceof Function) {
		param = param();
	}
	const firstFunc = funcs[0];
	if (firstFunc) {
		try {
			var result = firstFunc(param);
		} catch (err) {
			var error = err;
		}
	}
	const errors: unknown[] = [];
	for (const func of funcs) {
		try {
			func(param);
		} catch (err) {
			errors.push(err);
		}
	}
	for (const error of errors) {
		onError(error);
	}
	if (error) {
		throw error;
	} else {
		return result;
	}
};

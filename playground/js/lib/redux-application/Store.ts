import { Message, Store, ListenerCallback } from "./types";
import { Reducer } from "./Reducer";
import { TaskFn, TaskApi, TasksPool } from "./Task";
import { identity } from "../toolkit";
import {
	ERR_FINAL_USED_BEFORE_CREATED,
	ERR_LOCKED_UNSUBSCRIBE,
	ERR_LOCKED_DISPATCH,
	ERR_LOCKED_SUBSCRIBE,
	ERR_LOCKED_GETSTATE,
} from "./Errors.ts";
import { Msg } from "./Message.ts";

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
	let final = (): typeof store => {
		try {
			return store;
		} catch (error) {
			throw new Error(ERR_FINAL_USED_BEFORE_CREATED, { cause: error });
		}
	};
	const effects: Effects<TState, TMsg> = {
		executeTasks: defaultExecuteTasks(),
		notifyListeners: defaultNotifyListeners(),
	};
	const store: Store<TState, TMsg> = overlay(createStoreIml)(
		reducer,
		effects,
		() => final(),
	);
	final = () => store;
	return store;
}

export function createStoreIml<TState, TMsg extends Message>(
	reducer: Reducer<TState, TMsg>,
	effects: Effects<TState, TMsg>,
	final: () => Store<TState, TMsg>,
): Store<TState, TMsg> {
	const { executeTasks, notifyListeners } = effects;

	const listeners: Set<ListenerCallback<TMsg>> = new Set();

	let state: TState = Reducer.initialize(reducer);

	let store: Store<TState, TMsg>;
	const activeStore: Store<TState, TMsg> = (store = {
		dispatch(msgOrTask: TMsg | TaskFn<TState, TMsg, any>) {
			const ab = new AbortController();
			const taskApi = TaskApi.fromStore(final(), ab.signal);
			if (msgOrTask instanceof Function) {
				const task = msgOrTask;
				// TODO: need to handle task aborts in executeTasks too
				try {
					const result = task(taskApi);
					if (result instanceof Promise) {
						result.finally(() => ab.abort());
					}
					return result;
				} finally {
					ab.abort();
				}
			}
			const message = msgOrTask;
			const tpb = TasksPool.builder<TState, TMsg, void>();
			try {
				store = lockedStore;
				state = reducer(state, message, tpb.getScheduler());
			} finally {
				tpb.lockScheduler();
				store = activeStore;
			}
			executeTasks(tpb.getTasks(), taskApi);
			notifyListeners([...listeners], message);
		},

		subscribe(listener: ListenerCallback<TMsg>) {
			listeners.add(listener);
			const unsubscribe = () => {
				store.unsubscribe(listener);
			};
			unsubscribe.unsubscribe = unsubscribe;
			unsubscribe[Symbol.dispose] = unsubscribe;
			return unsubscribe;
		},

		unsubscribe(listener) {
			listeners.delete(listener);
		},

		getState() {
			return state;
		},
	});

	// biome-ignore format: looks funky
	return {
		dispatch:    (action: any) => store.dispatch (action    ),
		getState:    (           ) => store.getState (          ),
		subscribe:   (callback   ) => store.subscribe(callback  ),
		unsubscribe: (callback   ) => store.unsubscribe(callback)
	};
}

const lockedStore: Store<any, any> = {
	dispatch() {
		throw new Error(ERR_LOCKED_DISPATCH);
	},
	getState() {
		throw new Error(ERR_LOCKED_GETSTATE);
	},
	subscribe() {
		throw new Error(ERR_LOCKED_SUBSCRIBE);
	},
	unsubscribe() {
		throw new Error(ERR_LOCKED_SUBSCRIBE);
	},
};

interface Effects<TState, TMsg extends Message> {
	notifyListeners: NotifyListeners<TMsg>;
	executeTasks: ExecuteTasks<TState, TMsg>;
}

const defaultErrorHandler = console.error;

type ErrorHandlingConfig = {
	onError?: (error: unknown) => void;
};

type NotifyListeners<TMsg extends Message> = ReturnType<
	typeof defaultNotifyListeners<TMsg>
>;
export function defaultNotifyListeners<TMsg extends Message>({
	onError = defaultErrorHandler,
}: ErrorHandlingConfig = {}) {
	const notifyListeners = (
		listeners: readonly ListenerCallback<TMsg>[],
		message: TMsg,
	) => {
		runUninterupted(listeners, message, onError);
	};

	return notifyListeners;
}

type ExecuteTasks<TState, TMsg extends Message> = ReturnType<
	typeof defaultExecuteTasks<TState, TMsg>
>;
export function defaultExecuteTasks<TState, TMsg extends Message>({
	onError = defaultErrorHandler,
}: ErrorHandlingConfig = {}) {
	type TTaskFn = TaskFn<TState, TMsg, void>;
	const executeTasks = (
		tasks: readonly TTaskFn[],
		taskApi: TaskApi<TState, TMsg>,
	) => {
		runUninterupted(tasks, taskApi, onError);
	};

	return executeTasks;
}

function runUninterupted<Arg, Func extends (arg: Arg) => void>(
	callbacks: readonly Func[],
	arg: Arg,
	onError: (error: unknown) => void,
) {
	const errors: unknown[] = [];
	for (const func of callbacks) {
		try {
			func(arg);
		} catch (err) {
			errors.push(err);
		}
	}
	for (const error of errors) {
		onError(error);
	}
}


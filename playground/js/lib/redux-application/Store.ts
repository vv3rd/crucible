import { nanoid } from "nanoid";
import {
	Message,
	Reducer,
	TaskFn,
	TaskApi,
	Store,
	ListenerCallback,
} from "./types";
import { identity } from "rxjs";
import { match } from "../toolkit";

type WrappableStoreCreator<
	TState,
	TMsg extends Message,
> = typeof createStoreIml<TState, TMsg>;

type StoreWrapper<TState, TMsg extends Message> = (
	creator: WrappableStoreCreator<TState, TMsg>,
) => WrappableStoreCreator<TState, TMsg>;

export function createStore<TState, TMsg extends Message>(
	reducer: Reducer<TState, TMsg>,
	effects: Effects<TState, TMsg> = {},
	wrapper: StoreWrapper<TState, TMsg> = identity,
): Store<TState, TMsg> {
	// biome-ignore format: looks awful overwise
	const final = () => ({
		get dispatch() { return store.dispatch; },
		get getState() { return store.getState; },
		get subscribe() { return store.subscribe; },
	});
	const store: Store<TState, TMsg> = wrapper(createStoreIml)(
		reducer,
		effects,
		final,
	);
	return store;
}

export function createStoreIml<TState, TMsg extends Message>(
	reducer: Reducer<TState, TMsg>,
	effects: Effects<TState, TMsg> = {},
	final: () => Store<TState, TMsg>,
): Store<TState, TMsg> {
	const {
		executeTasks = defaultExecuteTasks(),
		notifyListeners = defaultNotifyListeners(),
	} = effects;

	type TVoidTaskFn = TaskFn<TState, TMsg, void>;
	type TDispatchArg = TMsg | TaskFn<TState, TMsg, any>;
	type TListenerCallback = ListenerCallback<TMsg>;
	type TStore = Store<TState, TMsg>;

	const listeners: Set<TListenerCallback> = new Set();

	const init = { type: "INIT-" + nanoid() } as any;
	let state = reducer(undefined, init, () => {});

	let currentStore: TStore;
	const activeStore: TStore = (currentStore = {
		dispatch(msgOrTask: TDispatchArg) {
			const taskApi = TaskApi.fromStore(final());
			if (msgOrTask instanceof Function) {
				const task = msgOrTask;
				return task(taskApi);
			}
			const message = msgOrTask;
			const tasks: TVoidTaskFn[] = [];
			let nextState = state;
			try {
				currentStore = lockedStore;
				nextState = reducer(state, message, (taskFn) => tasks.push(taskFn));
			} finally {
				currentStore = activeStore;
			}
			const isUnchanged = nextState === state;
			{
				state = nextState;
			}
			executeTasks(tasks, taskApi);
			if (isUnchanged) {
				return;
			}
			notifyListeners([...listeners], message);
		},

		subscribe(listener: TListenerCallback) {
			let isSubscribed = true;
			listeners.add(listener);
			return function unsubscribe() {
				if (!isSubscribed) {
					return;
				}
				if (currentStore === lockedStore) {
					throw new Error(ERR_LOCKED_UNSUBSCRIBE);
				}
				isSubscribed = false;
				listeners.delete(listener);
			};
		},

		getState() {
			return state;
		},
	});

	// biome-ignore format: looks funky
	return {
		dispatch:  (action: any) => currentStore.dispatch(action),
		getState:  (           ) => currentStore.getState(),
		subscribe: (callback   ) => currentStore.subscribe(callback),
	};
}

const lockedStore: Store<any, any> = {
	dispatch() {
		throw new Error(ERR_LOCKED_DISPATCH);
	},
	subscribe() {
		throw new Error(ERR_LOCKED_SUBSCRIBE);
	},
	getState() {
		throw new Error(ERR_LOCKED_GETSTATE);
	},
};

interface Effects<TState, TMsg extends Message> {
	notifyListeners?: NotifyListeners<TMsg>;
	executeTasks?: ExecuteTasks<TState, TMsg>;
}

const defaultErrorHandler = console.error;

type ErrorHandlingConfig = {
	onError?: (error: unknown) => void;
};

type NotifyListeners<TMsg extends Message> = ReturnType<
	typeof defaultNotifyListeners<TMsg>
>;
function defaultNotifyListeners<TMsg extends Message>({
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
function defaultExecuteTasks<TState, TMsg extends Message>({
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

// TODO: make errors helpful
const ERR_LOCKED_DISPATCH = (() => {
	let message = "Store is locked on dispatch";
	return message;
})();

const ERR_LOCKED_GETSTATE = (() => {
	let message = "Store is locked on dispatch";
	return message;
})();

const ERR_LOCKED_SUBSCRIBE = (() => {
	let message = "Store is locked on dispatch";
	return message;
})();

const ERR_LOCKED_UNSUBSCRIBE = (() => {
	let message = "Store is locked on dispatch";
	return message;
})();

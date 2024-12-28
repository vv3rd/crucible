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
	let final = (): typeof store => {
		try {
			return store;
		} catch (error) {
			throw new Error(ERR_FINAL_USED_BEFORE_CREATED, { cause: error });
		}
	};
	const store: Store<TState, TMsg> = wrapper(createStoreIml)(
		reducer,
		effects,
		() => final(),
	);
	final = () => store;
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

	const listeners: Set<ListenerCallback<TMsg>> = new Set();

	const init: any = { type: "INIT-" + nanoid() };
	let state: TState = reducer(undefined, init, () => {});

	let storeDelegate: Store<TState, TMsg>;
	const realStore: Store<TState, TMsg> = (storeDelegate = {
		dispatch(msgOrTask: TMsg | TaskFn<TState, TMsg, any>) {
			const taskApi = TaskApi.fromStore(final());
			if (msgOrTask instanceof Function) {
				const task = msgOrTask;
				return task(taskApi);
			}
			const message = msgOrTask;
			const tasks: TaskFn<TState, TMsg, void>[] = [];
			try {
				storeDelegate = lockedStore;
				state = reducer(state, message, (taskFn) => tasks.push(taskFn));
			} finally {
				storeDelegate = realStore;
			}
			executeTasks(tasks, taskApi);
			notifyListeners([...listeners], message);
		},

		subscribe(listener: ListenerCallback<TMsg>) {
			let isSubscribed = true;
			listeners.add(listener);
			return function unsubscribe() {
				if (storeDelegate === lockedStore) {
					throw new Error(ERR_LOCKED_UNSUBSCRIBE);
				}
				if (!isSubscribed) {
					return;
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
		dispatch:  (action: any) => storeDelegate.dispatch(action),
		getState:  (           ) => storeDelegate.getState(),
		subscribe: (callback   ) => storeDelegate.subscribe(callback),
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

const ERR_FINAL_USED_BEFORE_CREATED = (() => {
	let message = "Can't use final store before it is created";
	return message;
})();

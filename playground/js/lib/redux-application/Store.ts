import { nanoid } from "nanoid";
import {
	Message,
	Reducer,
	TaskFn,
	TaskApi,
	Store,
	ListenerCallback,
} from "./types";

const Builtin = {
	InitMessage: () => ({ type: "INIT-" + nanoid() }),
};

export function createStore<TState, TMsg extends Message>(
	reducer: Reducer<TState, TMsg>,
	effects: Effects<TState, TMsg> = {},
): Store<TState, TMsg> {
	type TTaskFn = TaskFn<TState, TMsg, void>;
	type TListenerCallback = ListenerCallback<TMsg>;

	const {
		executeTasks = defaultExecuteTasks(),
		notifyListeners = defaultNotifyListeners(),
	} = effects;

	const initialTasks: TTaskFn[] = [];
	let state: TState = reducer(undefined, Builtin.InitMessage() as any, (task) =>
		initialTasks.push(task),
	);

	let listeners: Set<TListenerCallback> = new Set();

	const activeStore: Store<TState, TMsg> = {
		dispatch(msgOrTask: TMsg | TaskFn<TState, TMsg, any>) {
			if (msgOrTask instanceof Function) {
				const task = msgOrTask;
				return task(taskApi);
			}
			const message = msgOrTask;
			const tasks: TTaskFn[] = [];
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

		subscribe(listener: ListenerCallback<TMsg>) {
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
	};

	const lockedStore: Store<TState, TMsg> = {
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

	let currentStore = activeStore;

	const store: Store<TState, TMsg> = {
		dispatch: (action: TMsg | TTaskFn) => currentStore.dispatch(action),
		getState: () => currentStore.getState(),
		subscribe: (callback) => currentStore.subscribe(callback),
	};

	const taskApi = TaskApi.fromStore(store);
	executeTasks(initialTasks, taskApi);

	return store;
}

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

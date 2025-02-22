import { Message, Store, ListenerCallback } from "./types";
import { Reducer } from "./Reducer";
import { AnyTaskFn, TaskFn } from "./Task";
import { identity } from "../toolkit";
import {
	ERR_FINAL_USED_BEFORE_CREATED,
	ERR_LOCKED_DISPATCH,
	ERR_LOCKED_SUBSCRIBE,
	ERR_LOCKED_GETSTATE,
	ERR_LOCKED_UNSUBSCRIBE,
} from "./Errors.ts";

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
	let delegateGetFinal = (): typeof store => {
		try {
			return store;
		} catch (error) {
			throw new Error(ERR_FINAL_USED_BEFORE_CREATED, { cause: error });
		}
	};
	const getFinalStore = () => delegateGetFinal();
	const store: Store<TState, TMsg> = overlay(createStoreIml)(
		reducer,
		undefined,
		getFinalStore,
	);
	delegateGetFinal = () => store;
	return store;
}

// declare const testTask: TaskFn<any, any, { foo: "test" }>;

export function createStoreIml<TState, TMsg extends Message>(
	reducer: Reducer<TState, TMsg>,
	effects: any,
	getFinalStore: () => Store<TState, TMsg>,
): Store<TState, TMsg> {
	const listeners: Set<ListenerCallback> = new Set();

	let state: TState = Reducer.initialize(reducer);

	let delegate: Store<TState, TMsg>;
	const activeStore: Store<TState, TMsg> = (delegate = {
		dispatch(msgLike: TMsg | TaskFn<TState, TMsg, any>) {
			if (typeof msgLike === "function") {
				return execute([msgLike], getFinalStore());
			}
			const tpb = TaskFn.pool<TState, TMsg, void>();
			try {
				delegate = lockedStore;
				state = reducer(state, msgLike, tpb.getScheduler());
			} finally {
				delegate = activeStore;
				tpb.lockScheduler();
			}
			execute([...tpb.getTasks(), ...listeners], getFinalStore());
		},

		subscribe(listener: ListenerCallback) {
			listeners.add(listener);
			const unsubscribe = () => delegate.unsubscribe(listener);
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
		dispatch:    (action: any) => delegate.dispatch (action    ),
		getState:    (           ) => delegate.getState (          ),
		subscribe:   (callback   ) => delegate.subscribe(callback  ),
		unsubscribe: (callback   ) => delegate.unsubscribe(callback)
	};
}

// biome-ignore format: looks funky
const lockedStore: Store<any, any> = {
	dispatch()    { throw new Error(ERR_LOCKED_DISPATCH);    },
	getState()    { throw new Error(ERR_LOCKED_GETSTATE);    },
	subscribe()   { throw new Error(ERR_LOCKED_SUBSCRIBE);   },
	unsubscribe() { throw new Error(ERR_LOCKED_UNSUBSCRIBE); },
};

const execute = <Ts extends AnyTaskFn[]>(
	tasks: Ts,
	store: Store<TaskFn.InferState<Ts[number]>, TaskFn.InferMsg<Ts[number]>>,
): ReturnType<Ts[0]> => {
	throw new Error("todo");
};

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

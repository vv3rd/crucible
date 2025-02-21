import { Message, SomeMessage } from "./types";
import { TaskScheduler } from "./Task";
import { Msg } from "./Message";

export interface Reducer<TState, TMsg extends Message> {
	(
		state: TState | undefined,
		message: TMsg,
		scheduler: TaskScheduler<TState, TMsg>,
	): TState;
}

type AnyReducer = Reducer<any, any>;

export namespace Reducer {
	const InitAction = { type: "INIT-" + Math.random() };

	export function initialize<TState>(reducer: Reducer<TState, any>) {
		return reducer(undefined, InitAction, () => {});
	}

	export function primitive<T, S extends string>(initialState: T, updType: S) {
		const updateMsg = Msg.ofType(updType).withPayload<
			T | ((current: T) => T)
		>();

		function primitiveReducer(
			state = initialState,
			msg: ReturnType<typeof updateMsg>,
		): T {
			if (updateMsg.match(msg)) {
				if (msg.payload instanceof Function) {
					return msg.payload(state);
				} else {
					return msg.payload;
				}
			}
			return state;
		}
		primitiveReducer.update = updateMsg;
		return primitiveReducer;
	}

	export const composed = composeReducersImpl as <M extends Dict<AnyReducer>>(
		reducersDict: M,
	) => ReducerFromCombination<M>;

	type ReducerFromCombination<
		M extends Dict<AnyReducer>,
		var_State = { [P in keyof M]: InferState<M[P]> },
		var_Msg extends Message = InferMsg<M[keyof M]>,
	> = keyof M extends never
		? Reducer<{}, SomeMessage>
		: Reducer<var_State, var_Msg>;

	export type InferMsg<R> = R extends Reducer<any, infer A> ? A : never;
	export type InferState<R> = R extends Reducer<infer S, any> ? S : never;
}

function composeReducersImpl(reducersObject: Record<string, AnyReducer>) {
	type TState = any;
	type TMsg = any;

	const reducers = Object.entries(reducersObject);

	if (reducers.length === 0) {
		const emptyState = {};
		return () => emptyState;
	}

	return function composedReducer(
		current: TState | undefined,
		action: TMsg,
		schedule: TaskScheduler<TState, TMsg>,
	): TState {
		let next: TState = current;
		for (let [key, reducer] of reducers) {
			const scheduleScoped = TaskScheduler.scoped(schedule, (s) => s[key]);
			const stateWas = current?.[key];
			const stateNow = reducer(stateWas, action, scheduleScoped);
			if (stateWas !== stateNow) {
				if (next === current) {
					next = { ...current };
				}
				next[key] = stateNow;
			}
		}
		return next;
	};
}

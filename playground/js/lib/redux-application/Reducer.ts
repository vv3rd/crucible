import { Message, AnyMessage, MessageWith } from "./types";
import { TaskScheduler } from "./Task";
import { Msg } from "./Message";
import { isPlainObject } from "../toolkit";
import { Fn } from "./Fn";

export interface Reducer<TState, TMsg extends Message> {
	(
		state: TState | undefined,
		message: TMsg,
		scheduler: TaskScheduler<TState>,
	): TState;
}

type AnyReducer = Reducer<any, any>;

export namespace Reducer {
	const InitAction = { type: "INIT-" + Math.random() };

	export const named = createReducerNamed;

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

	export const compose = composeReducersImpl as <M extends Dict<AnyReducer>>(
		reducersDict: M,
	) => ReducerFromCombination<M>;

	type ReducerFromCombination<
		M extends Dict<AnyReducer>,
		var_State = { [P in keyof M]: InferState<M[P]> },
		var_Msg extends Message = InferMsg<M[keyof M]>,
	> = keyof M extends never
		? Reducer<{}, AnyMessage>
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
		schedule: TaskScheduler<TState>,
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

interface Accessor<T> {
	(): T;
	(state: T | Partial<T>): T;
	(update: (state: T) => T | Partial<T>): T;
	do: TaskScheduler<T>;
}

export function createReducerNamed<T, N extends string>(
	name: N,
	initialState: T,
) {
	type Named<T extends string> = `${N}/${T}`;

	type TUpdaters = Record<
		string,
		(this: Accessor<T>, ...args: any[]) => void | T
	>;

	return <R extends TUpdaters>(updaters: R) => {
		type TMsgs = {
			[K in keyof R & string]: Msg.Writer<
				Named<K>,
				Fn<Parameters<R[K]>, MessageWith<Parameters<R[K]>, Named<K>>>
			>;
		};
		type TMsg = ReturnType<TMsgs[keyof TMsgs]>;

		const keys = Object.keys(updaters);
		const messages = Object.fromEntries(
			keys.map((key) => [
				key,
				Msg.ofType(`${name}/${key}`).withPayload<any[]>(),
			]),
		) as unknown as TMsgs;

		const reducer: Reducer<T, TMsg> = (state = initialState, msg, exec) => {
			if (!msg.type.startsWith(`${name}/`)) return state;
			const key = msg.type.slice(name.length + 1);
			const update = updaters[key];
			if (!update) return state;
			let accessor = ((...args) => {
				if (!args.length) {
					return state;
				}
				let next = args[0];
				if (next instanceof Function) next = next(state);
				if (isPlainObject(state) && isPlainObject(next)) {
					state = { ...state, ...next };
				} else {
					state = next as T;
				}
				return state;
			}) as Accessor<T>;
			accessor.do = exec;
			const outState = update.apply(accessor, msg.payload);
			if (outState !== undefined) {
				state = outState;
			}
			return state;
		};

		// TODO: add matchers for messages group, add getInitialState
		return Object.assign(reducer, {
			msg: messages,
			name,
		});
	};
}

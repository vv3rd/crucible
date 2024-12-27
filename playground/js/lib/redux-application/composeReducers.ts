import { Reducer, SetTask, SomeMessage, TaskApi } from "./types";

const { entries } = Object;

function composeReducersImpl(
	reducersObject: Record<string, Reducer<any, any>>,
) {
	type TState = any;
	type TMsg = any;

	const reducers = entries(reducersObject);

	if (reducers.length === 0) {
		const emptyState = {};
		return () => emptyState;
	}

	return function composedReducer(
		current: TState | undefined,
		action: TMsg,
		schedule: SetTask<TState, TMsg>,
	): TState {
		let next: TState = current;
		for (let [key, reducer] of reducers) {
			const scheduleScoped = scopeSchedulerUnder(key, schedule);
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

	function scopeSchedulerUnder(
		key: string,
		schedule: SetTask<TState, TMsg>,
	): SetTask<TState, TMsg> {
		return (taksFn) => {
			schedule((_taskApi) => {
				const scopedTaskApi = TaskApi.scoped(_taskApi, (state) => state[key]);
				return taksFn(scopedTaskApi);
			});
		};
	}
}

type MessageFromReducer<R> = R extends Reducer<any, infer A> ? A : never;

type StateFromReducersRecord<M> = M[keyof M] extends Reducer<any, any>
	? { [P in keyof M]: M[P] extends Reducer<infer S, any> ? S : never }
	: never;

type ReducerFromCombination<M> = M[keyof M] extends Reducer<any, any>
	? Reducer<
			StateFromReducersRecord<M>,
			MessageFromReducer<M[keyof M]> | SomeMessage
		>
	: never;

export const composeReducers = composeReducersImpl as <
	M extends Record<string, Reducer<any, any>>,
>(
	reducersRecord: M,
) => ReducerFromCombination<M>;

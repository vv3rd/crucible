import { identity } from "rxjs";
import { Reducer, SetTask, SomeAction } from "./reduxTypes";

const { entries } = Object;

function composeReducersImpl(
	reducersObject: Record<string, Reducer<any, any>>,
) {
	type TState = any;
	type TAction = any;

	const reducers = entries(reducersObject);

	if (reducers.length === 0) {
		const emptyState = {};
		return () => emptyState;
	}

	return function composedReducer(
		current: TState | undefined,
		action: TAction,
		schedule: SetTask<TState>,
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
		schedule: SetTask<TState>,
	): SetTask<TState> {
		return (taksFn) => {
			schedule(({ getState, ...taskApi }) => {
				const scopedApi = {
					...taskApi,
					getState: () => getState()[key],
				};
				return taksFn(scopedApi);
			});
		};
	}
}

type ActionFromReducer<R> = R extends Reducer<any, infer A> ? A : never;

type StateFromReducersRecord<M> = M[keyof M] extends Reducer<any, any>
	? { [P in keyof M]: M[P] extends Reducer<infer S, any> ? S : never }
	: never;

type ReducerFromCombination<M> = M[keyof M] extends Reducer<any, any>
	? Reducer<
			StateFromReducersRecord<M>,
			ActionFromReducer<M[keyof M]> | SomeAction
		>
	: never;

export const composeReducers = composeReducersImpl as <
	M extends Record<string, Reducer<any, any>>,
>(
	reducersRecord: M,
) => ReducerFromCombination<M>;

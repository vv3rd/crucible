import { Reducer, SetTask } from "./redux-thing";

const { entries } = Object;

export function composeReducers(
	reducersObject: Record<string, Reducer<any, any>>,
) {
	type State = any;
	type Action = any;
	const reducers = entries(reducersObject);

	return function composition(
		current: State | undefined,
		action: Action,
		schedule: SetTask<State>,
	): State {
		let next: State = current;
		for (let [key, reducer] of reducers) {
			const stateWas = current?.[key];
			const stateNow = reducer(stateWas, action, schedule); // TODO: scope task api
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

import { createAction } from "@reduxjs/toolkit";
import { Action, UnknownAction } from "redux";

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

interface ActionTyping<A extends Action> {
	type: A["type"];
	match: (actionLike: Action) => actionLike is A;
}

interface ActionDef<A extends Action = Action> extends ActionTyping<A> {
	(...args: any[]): A;
}

interface PayloadDef {
	(...args: any[]): { payload: any };
}

interface SetTask<TState> {
	(task: TaskFn<TState>): void;
}

interface TaskFn<TState> {
	(taskApi: TaskApi<TState>): void;
}

interface TaskApi<TState> {
	dispatch: (actionOrTask: Action) => void;
	getState: () => TState;
	getActions: () => AsyncGenerator<UnknownAction, void>;
}

interface Reducer<TState, TAction> {
	(state: TState, action: TAction, schedule: SetTask<TState>): TState;
}

interface AddCaseReducer<TState, TAction, B extends Build> {
	(
		reducer: (
			state: TState,
			action: TAction,
			schedule: SetTask<TState>,
		) => TState | void,
	): AddCase<TState, Build<B["action"] | TAction, B["creators"]>>;
}

interface AddCase<TState, B extends Build> {
	<N extends string, Fn extends PayloadDef>(
		actionType: N,
		preparePayload: Fn,
	): AddCaseReducer<
		TState,
		TypedAs<N, ReturnType<Fn>>,
		Build<B["action"], B["creators"] & { [key in N]: Fn }>
	>;

	<N extends string>(
		actionType: N,
	): AddCaseReducer<
		TState,
		{ type: N },
		Build<B["action"], B["creators"] & { [key in N]: () => {} }>
	>;

	<As extends readonly ActionDef[]>(
		...actionCreators: As
	): AddCaseReducer<TState, ReturnType<As[number]>, B>;

	reducer: {
		(state: TState, action: B["action"], schedule: SetTask<TState>): TState;
		getInitialState: () => TState;
	};

	actions: {
		[K in keyof B["creators"]]: ActionDef<
			TypedAs<Extract<K, string>, ReturnType<B["creators"][K]>>
		>;
	};
}

interface Build<A = unknown, C = Record<string, PayloadDef>> {
	action: A;
	creators: C;
}

interface Case {
	defs: ActionDef[];
	reduce: SomeFn;
}

type Fn<R = void, A extends any[] = []> = (...args: A) => R;
type SomeFn<R = any, A extends any[] = any[]> = Fn<R, A>;

type TypedAs<K extends string, T> = Pretty<{ type: K } & T>;

type Pretty<T> = { [K in keyof T]: T[K] } & {};

function defineState<T>(getInitialState: () => T) {
	function createReducer(cases: Case[]) {
		function finalReducer(
			state: T | undefined = getInitialState(),
			action: Action,
			schedule: SetTask<T>,
		) {
			for (const c of cases) {
				for (const d of c.defs) {
					if (d.type === action.type) {
						return c.reduce(state, action, schedule);
					}
				}
			}
			return state;
		}
		finalReducer.getInitialState = getInitialState;
		return finalReducer;
	}

	function createAddReducer(
		defs: ActionDef[],
		cases: Case[],
		actions: Record<string, ActionDef>,
	) {
		//
		function addReducer(reduce: SomeFn) {
			const newCase = { defs, reduce };
			return createAddCase([...cases, newCase], actions);
		}

		return addReducer;
	}

	function createAddCase(cases: Case[], actions: Record<string, ActionDef>) {
		//
		function addCase(
			firstArg: string | ActionDef,
			secondArg: ActionDef,
			...restArgs: ActionDef[]
		) {
			if (typeof firstArg === "string") {
				const newDef: ActionDef = (...args) => ({
					type: firstArg,
					payload: secondArg(...args),
				});
				newDef.type = firstArg;
				newDef.match = createMatcher(firstArg);

				return createAddReducer([newDef], cases, {
					...actions,
					[firstArg]: newDef,
				});
			} else {
				const defs = [firstArg];
				if (secondArg) defs.push(secondArg);
				if (restArgs.length) defs.push(...restArgs);
				return createAddReducer(defs, cases, actions);
			}
		}

		Object.defineProperties(addCase, {
			reducer: {
				get: () => createReducer(cases),
			},
			actions: {
				get: () => actions,
			},
		});

		return addCase;
	}

	const addCase = createAddCase([], {});

	return addCase as AddCase<T, Build<UnknownAction, {}>>;
}

function createMatcher(type: string) {
	return (ac: Action): ac is Action => ac.type === type;
}

const withPayload = <T>(payload: T) => ({ payload });

export const routine = ((type) => ({
	aborted: createAction(`${type}/ABORTED`),
	trigger: createAction(`${type}/TRIGGER`),
	request: createAction(`${type}/REQUEST`),
	success: createAction(`${type}/SUCCESS`, withPayload<{ bar: string }>),
	failure: createAction(`${type}/FAILURE`, (error: unknown) => ({
		payload: error,
	})),
}))("operations" as const);

const { reducer, actions } = defineState(() => ({
	foo: "bar",
}))(
	routine.success,
	routine.failure,
)((state, action) => {
	switch (action.type) {
		case "operations/SUCCESS":
			console.log(action.payload.bar);
			return state;
		case "operations/FAILURE":
			let x: unknown = action.payload;
			return state;
	}
	return absurd(action);
})(
	routine.failure,
	//
)((state) => {
	return {
		foo: state.foo,
	};
})("trigger", (kek: number) => ({
	payload: { kek },
}))((state, action) => {
	return {
		...state,
		foo: action.payload.kek.toString(),
	};
})("failure")((state) => {
	return {
		...state,
		foo: "fail",
	};
});

reducer({ foo: "" }, { type: "failure" }, () => {}).foo;

let x: "failure" = actions.failure().type;
let y: number = actions.trigger(1).payload.kek;

function defineActions<N extends string, R extends Record<string, PayloadDef>>(
	prefix: N,
	builder: (buildUtils: {}) => R,
) {}

const absurd = (_: never): never => {
	throw new Error("absurd");
};

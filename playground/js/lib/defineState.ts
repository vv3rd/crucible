import { createAction } from "@reduxjs/toolkit";
import {
	Reducer,
	SetTask,
	PayloadDef,
	AnyActionDef,
	Action,
	SomeAction,
	ActionDef,
} from "./redux-thing";

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

type CaseReducer<TState, TAction> = (
	state: TState,
	action: TAction,
	schedule: SetTask<TState>,
) => TState | void;

type AnyCaseReducer = CaseReducer<any, any>;

interface AddCaseReducer<TState, TAction, B extends Build> {
	(
		reducer: CaseReducer<TState, TAction>,
	): AddCase<TState, Build<B["action"] | TAction, B["preparers"]>>;
}

interface AddCase<TState, B extends Build> {
	<TType extends string, TPrep extends PayloadDef>(
		actionType: TType,
		preparePayload: TPrep,
	): AddCaseReducer<
		TState,
		Prepare<TType, TPrep>,
		Build<B["action"], B["preparers"] & { [key in TType]: TPrep }>
	>;

	<N extends string>(
		actionType: N,
	): AddCaseReducer<
		TState,
		Action<N>,
		Build<B["action"], B["preparers"] & { [key in N]: () => void }>
	>;

	<As extends readonly AnyActionDef[]>(
		...actionCreators: As
	): AddCaseReducer<TState, ReturnType<As[number]>, B>;

	reducer: Reducer<TState, B["action"]> & {
		getInitialState: () => TState;
	};

	actions: {
		[K in keyof B["preparers"]]: ActionDef<
			Prepare<K, B["preparers"][K]>,
			Parameters<B["preparers"][K]>
		>;
	};
}

interface Build<A = unknown, C = Record<string, PayloadDef>> {
	action: A;
	preparers: C;
}

interface Case {
	defs: AnyActionDef[];
	reduce: AnyCaseReducer;
}

type Prepare<K, T extends PayloadDef> = Pretty<
	{ type: Extract<K, string> } & ReturnType<T>
>;

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
		defs: AnyActionDef[],
		cases: Case[],
		actions: Record<string, AnyActionDef>,
	) {
		//
		function addReducer(reduce: AnyCaseReducer) {
			const newCase = { defs, reduce };
			return createAddCase([...cases, newCase], actions);
		}

		return addReducer;
	}

	function createAddCase(cases: Case[], actions: Record<string, AnyActionDef>) {
		//
		function addCase(
			firstArg: string | AnyActionDef,
			secondArg: AnyActionDef,
			...restArgs: AnyActionDef[]
		) {
			if (typeof firstArg === "string") {
				const newDef: AnyActionDef = (...args) => ({
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

	return addCase as AddCase<T, Build<SomeAction, {}>>;
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
		default:
			return absurd(action);
	}
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
})("failure")((state, action) => {
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

import { describe, expect, test, mock } from "bun:test";
import { defineState } from "./defineState";
import { defineActionKind, withPayload } from "./defineActions";
import { doNothing as noop } from "./utils";
import {
	Expect,
	IsAny,
	FalseCases,
	IsUnknown,
	TrueCases,
	Equal,
} from "type-testing";
import { Action } from "./reduxTypes";

const act = defineActionKind("", {
	p_any: withPayload<any>,
	p_object: withPayload<object>,
	p_array: withPayload<unknown[]>,
	p_real: withPayload<{}>,
	p_undefined: withPayload<undefined>,
	p_null: withPayload<null>,
	p_unknown: withPayload<unknown>,
	p_void: withPayload<void>,
	p_none: () => ({}),
});

const getInitialState = () => ({
	test: 123,
});

const InitAction = { type: "init" + Math.random() };

describe("defineState", () => {
	test("no cases", () => {
		const { reducer, actions } = defineState(getInitialState);
		expect(actions).toStrictEqual({});

		const state = reducer(undefined, InitAction, noop);
		expect(state).toEqual(getInitialState());
		const nextState = reducer(state, InitAction, noop);
		expect(nextState).toBe(state);
	});

	test("defined actionns", () => {
		const spy = mock();
		const build = defineState(() => ({
			...getInitialState(),
		}))("trigger")((state, action) => {
			type _t1 = FalseCases<
				[
					IsAny<typeof state>,
					IsAny<typeof action>,
					IsUnknown<typeof state>,
					IsUnknown<typeof action>,
				]
			>;
			type _t2 = TrueCases<
				[
					Equal<ReturnType<typeof getInitialState>, typeof state>,
					Equal<Action<"trigger">, typeof action>,
				]
			>;

			spy();
			expect(state).toEqual(getInitialState());
			expect(action.type).toBe("trigger");
			return {
				test: 321,
			};
		});
		const { reducer, actions } = build;

		const initialState = reducer(undefined, InitAction, noop);
		expect(spy).not.toBeCalled();
		let nextState = reducer(initialState, actions.trigger(), noop);
		expect(nextState).not.toEqual(initialState);
		expect(nextState).toEqual({ test: 321 });
		expect(spy).toBeCalled();

		// TODO:  rething and test repeating cases
		// const { reducer: newReducer, actions: newActions } = build(
		// 	"trigger",
		// 	(input: number) => ({ payload: input }),
		// )((state) => {});
	});

	test("external actions", () => {
		const spy = mock();
		const { reducer, actions } = defineState(() => ({
			...getInitialState(),
		}))(act.p_any)((_, action) => {
			type _ = Expect<IsAny<typeof action.payload>>;
		})(act.p_object)((_, action) => {
			type _ = Expect<Equal<typeof action.payload, object>>;
			spy(action);
			expect(action.payload).toBeTypeOf("object");
		})(act.p_array)((_, action) => {
			type _ = Expect<Equal<typeof action.payload, unknown[]>>;
			spy(action);
			expect(action.payload).toBeInstanceOf(Array);

		})(act.p_real)((_, action) => {
			type _ = Expect<Equal<typeof action.payload, {}>>;
			spy(action);
			expect(action.payload).toBeDefined();
		})(act.p_undefined)((_, action) => {
			type _ = Expect<Equal<typeof action.payload, undefined>>;
			spy(action);
			expect(action.payload).toBeTypeOf("undefined");
		})(act.p_null)((_, action) => {
			type _ = Expect<Equal<typeof action.payload, null>>;
			spy(action);
			expect(action.payload).toBeNull();
		})(act.p_unknown)((_, action) => {
			type _ = Expect<IsUnknown<typeof action.payload>>;
		})(act.p_void)((_, action) => {
			type _ = Expect<Equal<typeof action.payload, void>>;
			spy(action);
			expect(action.payload).toBeUndefined();
		});

		expect(actions).toStrictEqual({});

		const dispatched = [
			act.p_object({ foo: "bar" }),
			act.p_array([]),
			act.p_real("not nullish"),
			act.p_undefined(undefined),
			act.p_null(null),
			act.p_void(),
		];
		for (const action of dispatched) {
			reducer(undefined, action, noop);
			expect(spy).toHaveBeenLastCalledWith(action);
		}
		expect(spy).toBeCalledTimes(dispatched.length);
	});
});

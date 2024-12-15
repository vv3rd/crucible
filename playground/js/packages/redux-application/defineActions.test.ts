import { describe, expect, test, mock } from "bun:test";
import { defineActionKind, withPayload, noPayload } from "./defineActions";
import { Action } from "./reduxTypes";
import { Equal, Expect, IsUnion, NotEqual, TrueCases } from "type-testing";

describe("defineActionKind", () => {
	const action = defineActionKind("namespace", {
		justType: noPayload,
		gotPayload: withPayload<{ data: string }>,
	});
	const justTypeAction = action.justType();
	const gotPayloadAction = action.gotPayload({ data: "foo" });

	test("creating action objects", () => {
		expect(justTypeAction).toMatchObject({
			type: "namespace/justType",
		});
		expect(gotPayloadAction).toMatchObject({
			payload: {
				data: "foo",
			},
			type: "namespace/gotPayload",
		});
	});

	test("matching actions", () => {
		const spy = mock();
		let untyped: Action;

		untyped = gotPayloadAction;
		{
			type _ = Expect<NotEqual<typeof untyped, typeof gotPayloadAction>>;
		}
		if (action.gotPayload.match(untyped)) {
			spy();
			type _ = Expect<Equal<typeof untyped, typeof gotPayloadAction>>;
		}
		expect(spy).toBeCalledTimes(1);

		untyped = justTypeAction;
		{
			type _ = Expect<NotEqual<typeof untyped, typeof justTypeAction>>;
		}
		if (action.justType.match(untyped)) {
			spy();
			type _ = Expect<Equal<typeof untyped, typeof justTypeAction>>;
		}
		expect(spy).toBeCalledTimes(2);

		expect(action.justType.match(gotPayloadAction)).toBe(false);
		expect(action.gotPayload.match(justTypeAction)).toBe(false);

		expect(action.match(gotPayloadAction) && action.match(justTypeAction)).toBe(
			true,
		);

		const someAction1 = { type: "has-random-symbol", kind: Symbol() };
		expect(action.match(someAction1)).toBe(false);
		const someAction2 = { type: "just-other-type" };
		expect(action.match(someAction2)).toBe(false);

		if (action.match(someAction2)) {
			type IsOneOf<A> = A extends typeof someAction2 ? true : false;
			type _ = TrueCases<
				[
					Expect<IsOneOf<typeof justTypeAction>>,
					Expect<IsOneOf<typeof gotPayloadAction>>,
					Expect<IsUnion<typeof someAction2>>,
					Expect<Equal<false, IsOneOf<typeof someAction1>>>,
				]
			>;
		}
	});
});

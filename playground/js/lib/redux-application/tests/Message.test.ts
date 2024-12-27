import { describe, expect, test, mock } from "bun:test";
import { defineMessageKind, withPayload, noPayload } from "../Message";
import { Message } from "../types";
import { Equal, Expect, IsUnion, NotEqual, TrueCases } from "type-testing";

describe("defineMessageKind", () => {
	const action = defineMessageKind("namespace", {
		justType: noPayload,
		gotPayload: withPayload<{ data: string }>,
	});
	const justTypeMessage = action.justType();
	const gotPayloadMessage = action.gotPayload({ data: "foo" });

	test("creating action objects", () => {
		expect(justTypeMessage).toMatchObject({
			type: "namespace/justType",
		});
		expect(gotPayloadMessage).toMatchObject({
			payload: {
				data: "foo",
			},
			type: "namespace/gotPayload",
		});
	});

	test("matching actions", () => {
		const spy = mock();
		let untyped: Message;

		untyped = gotPayloadMessage;
		{
			type _ = Expect<NotEqual<typeof untyped, typeof gotPayloadMessage>>;
		}
		if (action.gotPayload.match(untyped)) {
			spy();
			type _ = Expect<Equal<typeof untyped, typeof gotPayloadMessage>>;
		}
		expect(spy).toBeCalledTimes(1);

		untyped = justTypeMessage;
		{
			type _ = Expect<NotEqual<typeof untyped, typeof justTypeMessage>>;
		}
		if (action.justType.match(untyped)) {
			spy();
			type _ = Expect<Equal<typeof untyped, typeof justTypeMessage>>;
		}
		expect(spy).toBeCalledTimes(2);

		expect(action.justType.match(gotPayloadMessage)).toBe(false);
		expect(action.gotPayload.match(justTypeMessage)).toBe(false);

		expect(
			action.match(gotPayloadMessage) && action.match(justTypeMessage),
		).toBe(true);

		const someMessage1 = { type: "has-random-symbol", kind: Symbol() };
		expect(action.match(someMessage1)).toBe(false);
		const someMessage2 = { type: "just-other-type" };
		expect(action.match(someMessage2)).toBe(false);

		if (action.match(someMessage2)) {
			type IsOneOf<A> = A extends typeof someMessage2 ? true : false;
			type _ = TrueCases<
				[
					Expect<IsOneOf<typeof justTypeMessage>>,
					Expect<IsOneOf<typeof gotPayloadMessage>>,
					Expect<IsUnion<typeof someMessage2>>,
					Expect<Equal<false, IsOneOf<typeof someMessage1>>>,
				]
			>;
		}
	});
});

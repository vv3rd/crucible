import { describe, expect, it } from "bun:test";
import { doNothing as noop } from "../utils";
import { Reducer } from "../Reducer";

const InitMessage = { type: "Init" + Math.random() };

describe("composeReducer", () => {
	it("always returns same empty object when created with empty record", () => {
		const composition = Reducer.composed({});
		const fistState = composition(undefined, InitMessage, noop);
		const nextState = composition(undefined, InitMessage, noop);
		expect(nextState).toBe(fistState);
	});
});

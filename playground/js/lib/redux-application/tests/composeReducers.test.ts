import { describe, expect, it } from "bun:test";
import { composeReducers } from "../composeReducers";
import { doNothing as noop } from "../utils";

const InitMessage = { type: "Init" + Math.random() };

describe("composeReducer", () => {
	it("always returns same empty object when created with empty record", () => {
		const composition = composeReducers({});
		const fistState = composition(undefined, InitMessage, noop);
		const nextState = composition(undefined, InitMessage, noop);
		expect(nextState).toBe(fistState);
	});
});

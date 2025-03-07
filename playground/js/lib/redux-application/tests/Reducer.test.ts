import { describe, expect, it } from "bun:test";
import { Reducer } from "../Reducer";

describe("Reducer.composed", () => {
	it("always returns same empty object when created with empty record", () => {
		const composition = Reducer.compose({});
		const fistState = Reducer.initialize(composition);
		const nextState = Reducer.initialize(composition);
		expect(nextState).toBe(fistState);
	});

	it.todo("todo", () => {
	});
});

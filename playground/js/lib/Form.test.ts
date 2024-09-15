import { describe, test } from "bun:test";
import { Field, Form, createFieldReducer, createFormReducer } from "./Form";

const field =
	<T>(defaultValue: T) =>
	(fieldName: string) =>
		createFieldReducer(fieldName, defaultValue);

describe("createFormReducer() capabilities", () => {
	test("Validates on blur", () => {
		const form = createFormReducer({
			init: (pass: "fizz" | "buzz" | null) => ({
				username: field(""),
				password: field(pass),
			}),
			check: (values, msg) => ({
				task: (api) => {},
			}),
			submit: (values, api) => {},
		});

		let state = form.getInitialState(null);
		state = form(state, {
			type: Field.MsgType.Changed,
			name: "password",
			payload: "fizz",
		});
	});
});

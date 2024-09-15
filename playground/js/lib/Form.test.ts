import { describe, test } from "bun:test";
import { Field, Form, createFieldReducer, createFormReducer } from "./Form";

const field =
	<T>(defaultValue: T) =>
	(fieldName: string) =>
		createFieldReducer(fieldName, defaultValue);

describe("createFormReducer() capabilities", () => {
	test("Validates on blur", () => {
		const form = createFormReducer({
			init: () => ({
				username: field<string>(""),
				password: field<"fizz" | "buzz" | null>(null),
			}),
			check: (values, msg) => ({
				task: (api) => {},
			}),
			submit: (values, api) => {},
		});

		const formState = form.initialize({ username: "", password: "fizz" });
		form(formState, {
			type: Field.MsgType.Changed,
			payload: "",
			name: "username",
		});
	});
});

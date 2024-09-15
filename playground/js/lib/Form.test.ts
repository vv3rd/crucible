import { describe, test } from "bun:test";
import { Field, Form, createFieldReducer, createFormReducer } from "./Form";
import { combineReducers } from "redux";

const field =
	<T>(defaultValue: T) =>
	(fieldName: string) =>
		createFieldReducer(fieldName, defaultValue);

describe("createFormReducer() capabilities", () => {
	test("crash", () => {
		combineReducers({
			thing: () => {
				throw new Error("KEK");
			},
		})(undefined, { type: "" });
	});
	test.skip("Validates on blur", () => {
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

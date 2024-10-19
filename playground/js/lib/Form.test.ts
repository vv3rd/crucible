import { describe, test } from "bun:test";
import { Field, Form, createFieldReducer, createFormReducer } from "./Form";
import { useReducer } from "react";
import { nanoid } from "@reduxjs/toolkit";

const field =
	<T>(defaultValue: T) =>
	(fieldName: string) =>
		createFieldReducer(fieldName, defaultValue);

describe("createFormReducer() capabilities", () => {
	test("Validates on blur", () => {
		const { reducer, actions } = createFormReducer({
			init: (pass: "fizz" | "buzz" | null) => ({
				username: field(""),
				password: field(pass),
			}),
			check: (values, msg) => ({
				task: (api) => {},
			}),
			submit: (values, api) => {},
		});

		let state = reducer.getInitialState(null);
		state = reducer(state, actions.changed("password", "fizz"));
		state = reducer(state, actions.submit());
		state = reducer(state, actions.reset());
	});
});

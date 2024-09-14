import { describe, test } from "bun:test";
import { Field, Form, createFieldReducer, createFormReducer } from "./Form";

const stringField =
	(defaultValue: string, check?: Field.Checker<string>) =>
	(fieldName: string) =>
		createFieldReducer(fieldName, defaultValue, check);

describe("createFormReducer() capabilities", () => {
	test("Validates on blur", () => {
		const form = createFormReducer({
			fields: {
				username: stringField(""),
			},
		});

		const formState = form.initialize({ username: "" });
	});
});

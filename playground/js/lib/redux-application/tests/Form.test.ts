import { describe, test } from "bun:test";
import { createFieldReducer, createFormReducer } from "../Form";

const field =
    <T>(defaultValue: T) =>
    (fieldName: string) =>
        createFieldReducer(fieldName, defaultValue);

describe("createFormReducer() capabilities", () => {
    test("Validates on blur", () => {
        const { actions, reducer } = createFormReducer({
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

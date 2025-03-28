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
        type todo = { text: string; completed: boolean };
        const todosReducer = Reducer.build(
            "todos",
            {
                todos: Array<todo>(),
            },
            {
                todoAdded(item: todo) {
                    this({ todos: [...this().todos, item] });
                },
            },
        );
        todosReducer.message.todoAdded({ text: "", completed: false });
        todosReducer.reducer;
    });
});

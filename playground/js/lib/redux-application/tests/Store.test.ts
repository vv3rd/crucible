import { test } from "bun:test";
import { createStore } from "../Store";
import { Reducer } from "../Reducer";
import { expect } from "bun:test";

const reducer = Reducer.compose({
    count: Reducer.primitive(0, "setCount"),
});

test("just stuff in general", () => {
    const store = createStore(reducer);
    expect(store.getState()).toMatchSnapshot();
    store.dispatch({ type: "setCount", payload: 10 });
    expect(store.getState()).toMatchSnapshot();
});

test("overlay", () => {
    const store = createStore(reducer, (createStore) => {
        return (reducer, internals) => {
            const store = createStore(reducer, {
                ...internals,
            });

            return {
                ...store,
            };
        };
    });
    //
    //
});

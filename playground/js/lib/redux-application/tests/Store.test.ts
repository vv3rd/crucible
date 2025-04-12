import { test } from "bun:test";
import { Store } from "../Store";
import { Reducer } from "../Reducer";
import { expect } from "bun:test";

const reducer = Reducer.compose({
    count: Reducer.primitive(0, "setCount"),
});

test("just stuff in general", () => {
    const store = Store.create(reducer);
    expect(store.getState()).toMatchSnapshot();
    store.dispatch({ type: "setCount", payload: 10 });
    expect(store.getState()).toMatchSnapshot();
});

test("overlay", () => {
    const store = Store.create(reducer, {
        overlay: (createStore) => {
            return (reducer, ctx, final) => {
                const store = createStore(reducer, ctx, final);

                return {
                    ...store,
                };
            };
        },
    });
    //
    //
});

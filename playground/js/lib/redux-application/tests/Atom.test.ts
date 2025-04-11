import { describe, test } from "bun:test";
import { Store } from "../Store";
import { Reducer } from "../Reducer";
import { Atom } from "../Atom";
import { createWiringRoot } from "../Wire";

describe.only("Atom", () => {
    test("kitchen sink", () => {
        const store = Store.create(
            createWiringRoot(
                Reducer.compose({
                    $atomics: Atom.defaultRoot.reducer,
                    count: Reducer.primitive(0, "setCount"),
                }),
            ),
        );

        const stream = store.subscribe(() => {
            console.log(stream.lastMessage(), store.getState());
        });

        const foldCount = Reducer.primitive(0, "count-update");
        const count$ = Atom("count$", foldCount);
        const countOut = count$.select(store.getState());
        store.dispatch(countOut.mount());
        store.dispatch(countOut.envelope(foldCount.update(2)));
    });
});

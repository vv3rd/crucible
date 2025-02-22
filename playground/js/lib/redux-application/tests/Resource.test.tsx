import { test, expect } from "bun:test";
import { useSyncExternalStore } from "react";
import { createStore } from "../Store";
import { Message, MessageWith } from "../types";
import { Reducer } from "../Reducer";

test("Resource", () => {
  type State = null | {
    count: number;
  };
  const cacheR: Reducer<State, MessageWith<number, "inc"> | Message<"dec">> = (
    state = null,
    action,
    schedule,
  ) => {
    return state;
  };
  const reducer = Reducer.compose({
    cache: cacheR,
  });

  const store = createStore(reducer);

  function App() {
    const { cache } = useSyncExternalStore(store.subscribe, store.getState);
  }

  expect(true).toBe(true);
});

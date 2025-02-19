import { describe, test, expect, beforeEach, afterEach, mock } from "bun:test";
import { render, screen, act, waitFor } from "@testing-library/react";
import {
  Component,
  PropsWithChildren,
  ReactNode,
  Suspense,
  use,
  useSyncExternalStore,
} from "react";
import { Await, Catch, sleep } from "./test-utils";
import { createStore, defaultNotifyListeners } from "../Store";
import { Message } from "../types";
import { Reducer } from "../Reducer";

test("Resource", () => {
  const reducer = Reducer.composed({
    cache: (state = 0, action: Message<"inc"> | Message<"dec">) => {
      switch (action.type) {
        case "inc":
          return state + 1;
        case "dec":
          return state - 1;
        default:
          return state;
      }
    },
  });
  const store = createStore(reducer);

  function App() {
    const { cache } = useSyncExternalStore(store.subscribe, store.getState);
  }

  expect(true).toBe(true);
});

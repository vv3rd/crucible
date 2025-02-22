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
import { Message, MessageWith } from "../types";
import { Reducer } from "../Reducer";
import { TaskApi } from "../Task";

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

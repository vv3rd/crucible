import { Elysia } from "elysia";
import { html } from "@elysiajs/html";
import { staticPlugin } from "@elysiajs/static";
import { AtMain } from "./layouts/AtMain";
import {
  Action,
  applyMiddleware,
  legacy_createStore as createStore,
} from "redux";
import { createContainer, token, injected } from "brandi";
import { HasResolver } from "../types";

const reducer = (state = 0, action: Action<"inc" | "dec">) => {
  switch (action.type) {
    case "inc":
      return state + 1;
    case "dec":
      return state - 1;
    default:
      return state;
  }
};

const store = createStore(reducer);
const container = createContainer();

const tokens = {
  store: token<ReturnType<typeof reducer>>("store"),
  derived: token<string>("derived"),
};

container
  .bind(tokens.store)
  .toInstance(() => store.getState())
  .inResolutionScope();
container
  .bind(tokens.derived)
  .toInstance(injected((state: number) => `${state * 2}`, tokens.store))
  .inResolutionScope();

const entry = ({ resolve }: HasResolver) => {
  return (
    <AtMain>
      <h1 class="text-3xl">Title</h1>
      {Derived({ resolve })}
      <div class={"flex gap-4 py-4"}>
        <button class={"btn"} hx-post="/inc" hx-target="#succ">
          Inc
        </button>
        <button class={"btn"} hx-post="/dec" hx-target="#succ">
          Dec
        </button>
      </div>
    </AtMain>
  );
};

const Derived = ({ resolve }: HasResolver) => {
  const state = resolve(tokens.derived);
  return (
    <h2 id="succ" class={"text-xl"}>
      derived: {state}
    </h2>
  );
};

const setup = new Elysia()
  .decorate("resolve", container.get.bind(container))
  .decorate("dispatch", store.dispatch);

const app = new Elysia()
  .use(html())
  .use(staticPlugin())
  .use(setup)
  .get("/", entry)
  .post("/inc", ({ dispatch, resolve }) => {
    dispatch({ type: "inc" });
    return Derived({ resolve });
  })
  .post("/dec", ({ dispatch, resolve }) => {
    dispatch({ type: "dec" });
    return Derived({ resolve });
  })
  .listen(3000, (server) => {
    console.log(`🦊 Elysia is running at ${server.hostname}:${server.port}`);
  });

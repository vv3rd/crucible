console.log("Hello via Bun!");

type Action<T = string, P = unknown> = [T, P];

interface State<V> {
  subscribe(callback: (state: V) => void): () => void;
  snapshot(): V;
}

interface Task {
  (store: Store<any, any>): void | Promise<void>;
}

interface Select<M> {
  [key: string]: (model: M) => unknown;
}

interface Reduce<M, A extends Action> {
  (model: M): (action: A) => { next: M; task: Task };
}

interface Module<M, A extends Action, N extends string> {
  name: N;
  reduce: Reduce<M, A>;
  select: Select<M>;
}
namespace Module {
  export type Any = Module<any, any, any>;
  export type inferModel<M extends Any> = M extends Module<infer M, any, any>
    ? M
    : never;

  export type inferAction<M extends Any> = M extends Module<any, infer A, any>
    ? A
    : never;

  export type inferName<M extends Any> = M extends Module<any, any, infer N>
    ? N
    : never;
}

type DefineActions<A> = {
  [K in keyof A]: [K, A[K]];
}[keyof A];

const joinModules = <Ms extends readonly Module<any, any, string>[]>() => {};

type ModuleJoin<T extends Module<any, any, any>[], N extends string> = {
  [K in Module.inferName<T[number]>]: Module<
    Module.inferModel<Extract<T[number], Module<any, any, K>>>,
    Module.inferAction<Extract<T[number], Module<any, any, K>>>,
    N
  >;
};

interface NewModule<M, A extends Action, S> {
  create: () => M;
  reduce: (model: M) => (action: A) => void | {
    next?: M;
    task?: Task;
  };
  select: {
    [K in keyof S]: (model: M) => S[K];
  };
}

type OptionalityTuple<T> = T extends void ? [] : [T];

interface Store<S, A extends [string, unknown?]> {
  select<K extends keyof S>(key: K): State<S[K]>;
  dispatch<K extends A[0]>(
    action: K,
    ...payload: OptionalityTuple<Extract<A, Action<K, any>>[1]>
  ): void;
}

const mkStore = <M, S, A extends Action>(
  module: NewModule<M, A, S>,
): Store<S, A> => {
  return {
    dispatch(action, ...[payload]) {},
    select(key) {
      throw new Error("not implemented");
    },
  };
};

type AppAction = DefineActions<{
  increment: { by: number };
  reset: void;
}>;

enum state {
  kek,
  lol,
}

const store = mkStore({
  create: () => ({
    count: 0,
    state: state.kek,
  }),
  reduce: (model) => {
    switch (model.state) {
      case state.kek:
        return (action: AppAction) => {};
      case state.lol:
        return (action: AppAction) => {};
    }
  },
  select: {
    "kek/getter": (model) => model.count,
  },
});

store.dispatch("reset");

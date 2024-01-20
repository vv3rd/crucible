import { CircularDependencyError, UnboundTokenError } from "./errors";

const never = (): never => {
	throw new Error("Never should be called");
};

const identity = <T,>(thing: T): T => thing;

const noop = (..._: any[]): void => {};

type Some = {};
type Fn<R = void, A extends any[] = []> = (...args: A) => R;
type SomeFn = Fn<Some, Some[]>;
type SomeToken = Token<Some>;
type AnyFn = Fn<any, any[]>;

const mkTools = () => {
	const injections = new Map<AnyFn, SomeToken[]>();
	const mkSelector = (() => {
		const overload1 =
			<T extends SomeToken[]>(...tokens: T) =>
			<R extends Some>(selector: Fn<R, Token.ValueList<T>>) => {
				injections.set(selector, tokens);
				return selector;
			};
		const overload2 =
			<R extends Some, A extends Some[]>(selector: Fn<R, A>) =>
			(...tokens: Token.List<A>) => {
				injections.set(selector, tokens);
				return selector;
			};
		const mkSelector = (first: SomeToken | SomeFn, ...rest: SomeToken[]) => {
			switch (true) {
				case typeof first === "symbol":
					return overload1(first, ...rest);
				case typeof first === "function":
					return overload2(first);
				default:
					return never();
			}
		};
		return mkSelector as typeof overload1 & typeof overload2;
	})();

	const mkProvider = <M,>(builderScope: Provider.BuilderScope) => {
		const enum boundTo {
			model,
			chain,
		}
		const modelBinding = <T,>(selector: Selector<T>) => ({
			type: boundTo.model as const,
			selector,
		});
		const chainBinding = <T,>(selector: Fn<T, unknown[]>, dependencies: SomeToken[]) => ({
			type: boundTo.chain as const,
			selector,
			dependencies,
		});
		type Selector<T> = (model: M) => T;
		type Binding<T> = ReturnType<typeof modelBinding<T> | typeof chainBinding<T>>;

		const bindings = new Map<SomeToken, Binding<{}>>();
		const bind: Provider.BindMethod = (token, selector) => {
			const dependencies = injections.get(selector);
			if (dependencies) {
				bindings.set(token, chainBinding(selector, dependencies));
			} else {
				bindings.set(token, modelBinding(selector));
			}
			return bind;
		};

		const resolutionChain = new Set<SomeToken>();
		const resolve = <T extends {}>(token: Token<T>): ((model: M) => T) => {
			const binding = bindings.get(token) as Binding<T>;
			if (!binding) {
				throw new UnboundTokenError(token);
			}
			if (resolutionChain.has(token)) {
				throw new CircularDependencyError(token);
			}
			if (binding.type === boundTo.model) {
				return binding.selector;
			}
			try {
				resolutionChain.add(token);
				const selectors = binding.dependencies.map(resolve);
				return (model) => binding.selector(...selectors.map((sel) => sel(model)));
			} finally {
				resolutionChain.delete(token);
			}
		};

		builderScope({
			bind: bind,
		});

		const provider: Provider<M> = {
			resolve,
		};

		return provider;
	};

	const mkToken = <T extends {}>(name: string): Token<T> => Symbol.for(`token:${name}`);

	const mkObservableCell = <T,>(value: T) => {
		const subs = new Set<Fn>();
		return {
			get() {
				return value;
			},
			set(newValue: T) {
				value = newValue;
				for (const sub of subs) sub();
			},
			subscribe(subscriber: Fn) {
				subs.add(subscriber);
				return () => {
					subs.delete(subscriber);
				};
			},
		};
	};

	const mkId = () => Math.random().toString(36).substring(2);

	const mkStore = <M extends Some, A extends Event>(actor: Actor<M, A>): Store<M, A> => {
		let { next: model, task } = actor(undefined, { type: mkId() });
		const cell = mkObservableCell({
			actor,
			model,
			task,
		});

		const store: Store<M, A> = createStore<M, A>(cell);

		return store;
	};

	const createStore = <M extends Some, E extends Event>(
		cell: Cell<StateBundle<M, E>>,
	): Store<M, E> => {
		return {
			snapshot() {
				return cell.get().model;
			},
			subscribe(callback) {
				return cell.subscribe(callback);
			},
			select(selector) {
				const subModel = selector(cell.get().model);
				const nextCell = mkObservableCell({ ...cell.get(), model: subModel });
				cell.subscribe(() => {
					const selected = selector(cell.get().model);
					if (nextCell.get().model !== selected) {
						nextCell.set({ ...cell.get(), model: selected });
					}
				});

				throw new Error("");
			},
			dispatch(action) {
				const { actor, model } = cell.get();
				const { next, task } = actor(model, action);
				cell.set({ actor, model: next, task });
			},
		};
	};

	return {
		mkProvider,
		mkSelector: mkSelector,
		mkToken,
		mkStore,
	};
};

interface Event<T = string, P = undefined> {
	type: T;
	data?: P;
}

const TokenType = Symbol();
export type Token<T extends Some> = symbol & {
	[TokenType]?: T;
};
export namespace Token {
	export type Value<T extends Token<any>> = T extends Token<infer U> ? U : never;
	export type ValueList<T extends Token<any>[]> = { [K in keyof T]: Token.Value<T[K]> };
	export type List<S extends any[]> = { [K in keyof S]: Token<S[K]> };
}

interface Task {
	(store: Store<Some, Event>): void | Promise<void>;
}

interface Actor<M, E extends Event> {
	(model: M | undefined, action: E | Event): { next: M; task: Task };
}

interface Observable {
	subscribe(callback: Fn): Fn;
}

interface Cell<T extends Some> extends Observable {
	get(): T;
	set(value: T): void;
}

interface Store<M extends Some, E extends Event> extends Observable {
	snapshot(): M;
	select<T extends Some>(selector: (model: M) => T): Store<T, E>;
	dispatch(action: E): void;
}

type StateBundle<M extends Some, E extends Event> = {
	actor: Actor<M, E>;
	model: M;
	task: Task;
};

interface Provider<M> {
	resolve<T extends {}>(token: Token<T>): (model: M) => T;
}
namespace Provider {
	export type BindMethod = <T extends {}>(
		token: Token<T>,
		resolver: (...args: unknown[]) => T,
	) => BindMethod;

	export type Builder = {
		bind: BindMethod;
	};

	export type BuilderScope = (builder: Builder) => void;
}

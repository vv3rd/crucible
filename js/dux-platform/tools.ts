import { CircularDependencyError, UnboundTokenError } from "./errors";

const never = (): never => {
	throw new Error("Never should be called");
};

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

	const mkStore = <M extends Some, A extends Event>(
		actor: Actor<M, A>,
		provider: Provider<M>,
	): Store<M, A> => {
		const subscribers = new Set<Function>();
		const notify = () => subscribers.forEach((sub) => sub(model));

		const mkState = <T extends Some>(selector: Fn<T, [model: M]>): Store<T, A> => {
			let currentState: T;
			return {
				snapshot() {
					return (currentState = selector(model));
				},
				subscribe(callback) {
					const subscriber = () => {
						const state = selector(model);
						if (state !== currentState) {
							callback((currentState = state));
						}
					};
					subscribers.add(subscriber);
					return () => {
						subscribers.delete(subscriber);
					};
				},
				select,
				dispatch
			};
		};

		const select = <T extends Some>(token: Token<T>): State<T> => {
			const selector = provider.resolve(token);
			return mkState(selector);
		};

		const dispatch = (action: A): void => {
			const { next, task } = actor(model, action);
			model = next;
			notify();
			task(store);
		};

		const store = mkState(model => model);

		let { next: model } = actor(undefined, {
			type: Math.random().toString(36).substring(2),
		});

		return store;
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

interface State<M> {
	subscribe(callback: (state: M) => void): () => void;
	snapshot(): M;
}

interface Store<M extends Some, E extends Event> extends State<M> {
	select<T extends Some>(key: Token<T>): State<T>;
	dispatch(action: E): void;
}

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

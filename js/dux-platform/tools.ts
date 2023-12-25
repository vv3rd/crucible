import { CircularDependencyError, UnboundTokenError } from "./errors";

const mkTools = () => {
	const injections = new Map<Function, Token<{}>[]>();

	const _mkSelector = (tokensOrSelector: any) => {
		const mkInjection = (tokens: Token<any>[], selector: Function) => {
			injections.set(selector, tokens);
			return selector;
		};
		if (typeof tokensOrSelector === "function") {
			const selector = tokensOrSelector;
			return (tokens: any) => mkInjection(tokens, selector);
		} else {
			const tokens = tokensOrSelector;
			return (selector: any) => mkInjection(tokens, selector);
		}
	};
	const mkSelector = _mkSelector as {
		<A extends unknown[], R>(
			selector: (...args: A) => R,
		): (...tokens: Token.List<A>) => (...args: A) => R;
		<T extends readonly Token<{}>[]>(
			...tokens: T
		): <S extends (...args: { [K in keyof T]: Token.Value<T[K]> }) => any>(selector: S) => S;
	};

	const mkProvider = (builderScope: Provider.BuilderScope) => {
		let bindings = new Map<Token<{}>, (...args: unknown[]) => unknown>();

		const bindMethod: Provider.BindMethod = (token, resolver) => (
			bindings.set(token, resolver), bindMethod
		);
		builderScope({
			bind: bindMethod,
		});

		const resolutionChain = new Set<Token<{}>>();

		const resolve = <T extends {}>(token: Token<T>): T => {
			if (resolutionChain.has(token)) {
				throw new CircularDependencyError(token);
			}
			try {
				resolutionChain.add(token);
				const selector = bindings.get(token);
				if (!selector) {
					throw new UnboundTokenError(token);
				}
				const dependencies = injections.get(selector) ?? [];
				const result = selector(...dependencies.map(resolve));
				return result as T;
			} finally {
				resolutionChain.delete(token);
			}
		};

		const provider: Provider = {
			resolve,
		};

		return provider;
	};

	const mkToken = <T extends {}>(name: string): Token<T> => Symbol.for(`token:${name}`);

	const mkStore = <M, A extends Event>(
		actor: Actor<M | undefined, A | Event>,
		provider: Provider,
	): Store<A> => {
		const subscribers = new Set<Function>();

		const store: Store<A> = {
			select<T extends {}>(token: Token<T>): Subject<T> {
				const state: Subject<T> = {
					snapshot() {
						throw new Error("TODO");
					},
					subscribe(callback) {
						return () => {};
					},
				};
				return state;
			},
			dispatch(action) {
				const { next, task } = actor(model, action);
				model = next;
				for (const sub of subscribers) sub(next);
				task(store);
			},
		};

		let { next: model } = actor(undefined, {
			type: Math.random().toString(36).substring(2),
		});

		return store;
	};

	return {
		mkProvider,
		mkSelector,
		mkToken,
		mkStore,
	};
};

interface Event<T = string, P = undefined> {
	type: T;
	data?: P;
}

const TokenType = Symbol();
export type Token<T extends {}> = symbol & {
	[TokenType]?: T;
};
export namespace Token {
	export type Value<T extends Token<any>> = T extends Token<infer U> ? U : never;

	export type List<S extends any[]> = {
		[K in keyof S]: Token<S[K]>;
	};
}

interface Subject<V> {
	subscribe(callback: (state: V) => void): () => void;
	snapshot(): V;
}

interface Task {
	(store: Store): void | Promise<void>;
}

interface Actor<M, E extends Event> {
	(model: M, action: E): { next: M; task: Task };
}

interface Store<E extends Event = Event> {
	select<T extends {}>(key: Token<T>): Subject<T>;
	dispatch(action: E): void;
}

interface Provider {
	resolve<T extends {}>(token: Token<T>): T;
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

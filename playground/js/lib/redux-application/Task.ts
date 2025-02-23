import { FUCK_TASK_POOL_CLOSED } from "./Errors";
import { Matchable, Message, SomeMessage, Store } from "./types";

export type AnyTask<R = any> = Task<any, R>;
export interface Task<TState, TResult = void> {
	(tools: TaskTools<TState>): TResult;
}

export interface TaskTools<TState> {
	signal: AbortSignal;
	dispatch: (message: SomeMessage) => void;
	getState: () => TState;
	nextMessage: () => Promise<SomeMessage>;
}

export namespace Task {
	export const pool = <TState, TResult = void>() => {
		const tasks: Task<TState, TResult>[] = [];
		let scheduler = tasks.push.bind(tasks);
		return {
			getTasks: () => [...tasks],
			getScheduler: (): typeof scheduler => (task) => scheduler(task),
			lockScheduler: () => {
				scheduler = () => {
					throw new Error(FUCK_TASK_POOL_CLOSED);
				};
			},
		};
	};
	export type InferState<R> = R extends Task<infer S, any> ? S : never;
}

export namespace TaskTools {
	export const scoped = <TStateA, TStateB>(
		tools: TaskTools<TStateA>,
		seletor: (state: TStateA) => TStateB,
	): TaskTools<TStateB> => {
		return {
			...tools,
			getState: () => seletor(tools.getState()),
		};
	};

	export const fromStore = <TState>(
		store: Store<TState, any>,
		signal = AbortSignal.abort(),
	): TaskTools<TState> => {
		let nextMessage: Promise<SomeMessage> | undefined;
		// biome-ignore format:
		const getNextMessage = () => nextMessage ?? (nextMessage = new Promise<SomeMessage>((resolve) => {
			const unsubscribe = store.subscribe((message) => {
				nextMessage = undefined
				unsubscribe();
				resolve(message);
			});
		}));
		return {
			signal,
			getState: store.getState,
			dispatch: store.dispatch,
			nextMessage: getNextMessage,
		};
	};

	export function helper<T>(tools: TaskTools<T>) {
		async function condition(checker: (state: T) => boolean): Promise<T>;

		async function condition<U extends T>(
			checker: (state: T) => state is U,
		): Promise<U>;
		async function condition(checker: (state: T) => boolean): Promise<T> {
			let state = tools.getState();
			while (!checker(state)) {
				await tools.nextMessage();
				state = tools.getState();
			}
			return state;
		}

		async function take<T extends Message>(matcher: Matchable<T>): Promise<T> {
			let awaitedMessage: T | undefined;
			while (awaitedMessage === undefined) {
				const msg = await tools.nextMessage();
				if (matcher.match(msg)) {
					awaitedMessage = msg;
				}
			}
			return awaitedMessage;
		}

		async function* stream(): AsyncGenerator<Message, void, void> {
			while (true) yield await tools.nextMessage();
		}

		return {
			...tools,
			condition,
			take,
			stream,
		};
	}
}

export interface TaskScheduler<TState> {
	(task: Task<TState, void>): void;
}
export namespace TaskScheduler {
	export const scoped =
		<TStateA, TStateB>(
			unscopedScheduler: TaskScheduler<TStateA>,
			selector: (state: TStateA) => TStateB,
		): TaskScheduler<TStateB> =>
		(taksFn) => {
			unscopedScheduler((tools) => taksFn(TaskTools.scoped(tools, selector)));
		};
}

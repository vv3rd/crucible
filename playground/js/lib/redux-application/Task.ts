import { FUCK_TASK_POOL_CLOSED } from "./Errors";
import { Matchable, Message, SomeMessage, Store } from "./types";

export type AnyTaskFn<R = any> = TaskFn<any, R>;
export interface TaskFn<TState, TResult = void> {
	(taskApi: TaskApi<TState>): TResult;
}

export interface TaskApi<TState> {
	signal: AbortSignal;
	dispatch: (message: SomeMessage) => void;
	getState: () => TState;
	nextMessage: () => Promise<SomeMessage>;
}

export namespace TaskFn {
	export function execute<R, S>(task: TaskFn<S, R>, store: Store<any, any>): R {
		const ab = new AbortController();
		const api = { ...TaskApi.fromStore(store), signal: ab.signal };
		let result: R;
		try {
			result = task(api);
		} finally {
			ab.abort();
		}
		if (result instanceof Promise) {
			result.finally(() => ab.abort());
		}
		return result;
	}

	export const pool = <TState, TResult = void>() => {
		const tasks: TaskFn<TState, TResult>[] = [];
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
	export type InferState<R> = R extends TaskFn<infer S, any> ? S : never;
}

export namespace TaskApi {
	export const scoped = <TStateA, TStateB>(
		taskApi: TaskApi<TStateA>,
		seletor: (state: TStateA) => TStateB,
	): TaskApi<TStateB> => {
		return {
			...taskApi,
			getState: () => seletor(taskApi.getState()),
		};
	};

	export const fromStore = <TState>(
		store: Store<TState, any>,
		signal = AbortSignal.abort(),
	): TaskApi<TState> => {
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

	export function helper<T>(taskApi: TaskApi<T>) {
		async function condition(checker: (state: T) => boolean): Promise<T>;

		async function condition<U extends T>(
			checker: (state: T) => state is U,
		): Promise<U>;
		async function condition(checker: (state: T) => boolean): Promise<T> {
			let state = taskApi.getState();
			while (!checker(state)) {
				await taskApi.nextMessage();
				state = taskApi.getState();
			}
			return state;
		}

		async function take<T extends Message>(matcher: Matchable<T>): Promise<T> {
			let awaitedMessage: T | undefined;
			while (awaitedMessage === undefined) {
				const msg = await taskApi.nextMessage();
				if (matcher.match(msg)) {
					awaitedMessage = msg;
				}
			}
			return awaitedMessage;
		}

		async function* stream(): AsyncGenerator<Message, void, void> {
			while (true) yield await taskApi.nextMessage();
		}

		return {
			...taskApi,
			condition,
			take,
			stream,
		};
	}
}

export interface TaskScheduler<TState> {
	(task: TaskFn<TState, void>): void;
}
export namespace TaskScheduler {
	export const scoped =
		<TStateA, TStateB>(
			unscopedScheduler: TaskScheduler<TStateA>,
			selector: (state: TStateA) => TStateB,
		): TaskScheduler<TStateB> =>
		(taksFn) => {
			unscopedScheduler((taskApi) => taksFn(TaskApi.scoped(taskApi, selector)));
		};
}

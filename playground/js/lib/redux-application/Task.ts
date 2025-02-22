import { ERR_SCHEDULER_USED_OUTSIDE_REDUCER } from "./Errors";
import { Falsy, Matchable, Message, Store } from "./types";

export interface TaskScheduler<TState, TMsg extends Message> {
	(task: TaskFn<TState, TMsg, void>): void;
}
export namespace TaskScheduler {
	export const scoped =
		<TStateA, TStateB, TMsg extends Message>(
			unscopedScheduler: TaskScheduler<TStateA, TMsg>,
			selector: (state: TStateA) => TStateB,
		): TaskScheduler<TStateB, TMsg> =>
		(taksFn) => {
			unscopedScheduler((taskApi) => taksFn(TaskApi.scoped(taskApi, selector)));
		};
}

export type AnyTaskFn<R = any> = TaskFn<any, any, R>;
export interface TaskFn<
	TState,
	TMsg extends Message = Message,
	TResult = void,
> {
	(taskApi: TaskApi<TState, TMsg>): TResult;
}

export namespace TaskFn {
	export function execute<R, S, M extends Message>(
		task: TaskFn<S, M, R>,
		store: Store<any, any>,
	): R {
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

	export const pool = <TState, TMsg extends Message, TResult = void>() => {
		const tasks: TaskFn<TState, TMsg, TResult>[] = [];
		let scheduler = tasks.push.bind(tasks);
		return {
			getTasks: () => [...tasks],
			getScheduler: (): typeof scheduler => (task) => scheduler(task),
			lockScheduler: () => {
				scheduler = () => {
					throw new Error(ERR_SCHEDULER_USED_OUTSIDE_REDUCER);
				};
			},
		};
	};
	export type InferMsg<R> = R extends TaskFn<any, infer A, any> ? A : never;
	export type InferState<R> = R extends TaskFn<infer S, any, any> ? S : never;
}

export interface TaskApi<TState, TMsg extends Message = Message> {
	signal: AbortSignal;
	dispatch: (actionOrTask: TMsg) => void;
	getState: () => TState;
	nextMessage: () => Promise<TMsg>;
}

export namespace TaskApi {
	export const scoped = <TStateA, TStateB, TMsg extends Message>(
		taskApi: TaskApi<TStateA, TMsg>,
		seletor: (state: TStateA) => TStateB,
	): TaskApi<TStateB, TMsg> => {
		return {
			...taskApi,
			getState: () => seletor(taskApi.getState()),
		};
	};

	export const fromStore = <TState, TMsg extends Message>(
		store: Store<TState, TMsg>,
		signal = AbortSignal.abort(),
	): TaskApi<TState, TMsg> => {
		let nextMessage: Promise<TMsg> | undefined;
		const getNextMessage = () => {
			if (!nextMessage) {
				nextMessage = new Promise<TMsg>((resolve) => {
					const unsubscribe = store.subscribe((message) => {
						nextMessage = undefined;
						unsubscribe();
						resolve(message);
					});
				});
			}
			return nextMessage;
		};
		return {
			signal,
			dispatch: store.dispatch,
			getState: store.getState,
			nextMessage: getNextMessage,
		};
	};

	export function helper<T, M extends Message>(taskApi: TaskApi<T, M>) {
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

		async function truthy<U>(selector: (state: T) => U | Falsy): Promise<U> {
			let result;
			while (!(result = selector(taskApi.getState())))
				await taskApi.nextMessage();
			return result;
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
			truthy,
			take,
			stream,
		};
	}
}

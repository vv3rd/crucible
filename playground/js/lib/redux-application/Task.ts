import { Matchable, Message, Store } from "./types";

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

export interface TaskFn<
	TState,
	TMsg extends Message = Message,
	TResult = void,
> {
	(taskApi: TaskApi<TState, TMsg>): TResult;
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
		signal: AbortSignal,
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

	export function helper<T>(taskApi: TaskApi<T>) {
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

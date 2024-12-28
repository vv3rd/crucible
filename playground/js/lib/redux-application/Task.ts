import { Message, Store } from "./types";

export interface TaskScheduler<TState, TMsg extends Message> {
	(task: TaskFn<TState, TMsg, void>): void;
}

export interface TaskFn<
	TState,
	TMsg extends Message = Message,
	TResult = void,
> {
	(taskApi: TaskApi<TState, TMsg>): TResult;
}

export interface TaskApi<TState, TMsg extends Message = Message> {
	dispatch: (actionOrTask: TMsg) => void;
	getState: () => TState;
	nextMessage: () => Promise<TMsg>;
}

export namespace TaskApi {
	export const scoped = <A, B>(
		taskApi: TaskApi<A>,
		seletor: (state: A) => B,
	): TaskApi<B> => {
		return {
			...taskApi,
			getState: () => seletor(taskApi.getState()),
		};
	};

	export const fromStore = <TState, TMsg extends Message>({
		subscribe,
		dispatch,
		getState,
	}: Store<TState, TMsg>): TaskApi<TState, TMsg> => {
		let nextMessage: Promise<TMsg> | undefined;
		const createNextMessagePromise = () =>
			new Promise<TMsg>((resolve) => {
				const unsubscribe = subscribe((message) => {
					nextMessage = undefined;
					unsubscribe();
					resolve(message);
				});
			});
		const getNextMessage = () => {
			if (!nextMessage) {
				nextMessage = createNextMessagePromise();
			}
			return nextMessage;
		};
		return { dispatch, getState, nextMessage: getNextMessage };
	};
}

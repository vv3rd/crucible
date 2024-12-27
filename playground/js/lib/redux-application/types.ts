export interface Message<T extends string = string> {
	type: T;
}

export interface SomeMessage extends Message {
	[extraProps: string]: unknown;
}

export interface Matchable<T extends Message> {
	match: (actionLike: Message) => actionLike is T;
}

export interface MessageFactory<
	A extends Message = Message,
	I extends any[] = [],
> extends Matchable<A> {
	(...inputs: I): A;
	type: A["type"];
}

export interface SetTask<TState, TMsg extends Message> {
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

export interface Unsubscribe {
	(): void;
}

export interface ListenerCallback<TMsg extends Message> {
	(message: TMsg): void;
}

export interface Store<TState, TMsg extends Message> {
	dispatch: Dispatch<TMsg, TState>;
	getState(): TState;
	subscribe(listener: ListenerCallback<TMsg>): Unsubscribe;
}

export interface Dispatch<TMsg extends Message, TState> {
	(action: TMsg): void;
	<TResult>(task: TaskFn<TState, TMsg, TResult>): TResult;
	<TResult>(actionOrTask: TMsg | TaskFn<TState, TMsg, TResult>): void | TResult;
}
export type Dispatchable<A extends Message, S> = A | TaskFn<S, any>;

export interface Reducer<TState, TMsg extends Message> {
	(
		state: TState | undefined,
		action: TMsg,
		schedule: SetTask<TState, TMsg>,
	): TState;
}

// Utils

export type Real = NonNullable<unknown>;
export type Dict<T> = Record<string, T>;

type Pretty<T> = { [K in keyof T]: T[K] } & {};

export type InferMatch<M extends Matchable<any>> = M extends Matchable<infer T>
	? T
	: never;

export type WithPrefix<P, A> = `${Extract<P, string>}/${Extract<A, string>}`;

export type AnyMessageMaker = MessageFactory<Message, any[]>;

export type AnyMessagePartMaker =
	| { (...args: any[]): { payload: any } }
	| { (): void };

export type MadeMessage<TType, TMaker extends AnyMessagePartMaker> = Pretty<
	{ type: Extract<TType, string> } & ReturnType<TMaker>
>;

export type CompleteMessageMaker<
	TType,
	TMaker extends AnyMessagePartMaker,
> = MessageFactory<MadeMessage<TType, TMaker>, Parameters<TMaker>>;

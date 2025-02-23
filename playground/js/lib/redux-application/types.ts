import { Task } from "./Task";

export type StateRoot = object & Record<string, any>;

export interface Selectable<T> {
	select: (stateRoot: StateRoot) => T;
}

export interface Discoverable<T> {
	discover: (stateRoot: StateRoot) => T;
}

export interface Matchable<T extends Message> {
	match: (actionLike: Message) => actionLike is T;
}

export namespace Message {
	export type Type = string;
}

export interface Message<T extends Message.Type = Message.Type> {
	type: T;
	// [key: string]: unknown;
}

export interface MessageWith<P, T extends Message.Type = Message.Type>
	extends Message<T> {
	payload: P;
}

export interface SomeMessage extends Message {
	[extraProps: string]: unknown;
}

export interface MessageFactory<
	A extends Message = Message,
	I extends any[] = [],
> extends Matchable<A> {
	(...inputs: I): A;
	type: A["type"];
}

export interface Subscription {
	// extends Disposable {
	// unsubscribe(): void;
	(): void;
}

export interface ListenerCallback<TMsg> {
	(message: TMsg): void;
}

export interface Store<TState, TMsg extends Message> {
	dispatch: Dispatch<TMsg | SomeMessage, TState>;
	getState: () => TState;
	subscribe: (listener: ListenerCallback<TMsg>) => Subscription;
	unsubscribe: (listener: ListenerCallback<TMsg>) => void;
}

export interface Dispatch<TMsg extends Message, TState> {
	(action: TMsg): void;
	<TResult>(task: Task<TState, TResult>): TResult;
}

// Utils

export type Real = NonNullable<unknown>;
export type Dict<T> = Record<string, T>;

export type Falsy = null | undefined | false | "" | 0 | 0n;
export type Pretty<T> = { [K in keyof T]: T[K] } & {};

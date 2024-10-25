export interface Action<T extends string = string> {
	type: T;
}

export interface SomeAction extends Action {
	[extraProps: string]: unknown;
}

export interface Matchable<T extends Action> {
	match: (actionLike: Action) => actionLike is T;
}

export interface ActionMaker<A extends Action = Action, I extends any[] = []>
	extends Matchable<A> {
	(...inputs: I): A;
	type: A["type"];
}

export interface SetTask<TState> {
	(task: TaskFn<TState>): void;
}

export interface TaskFn<TState, TResult = void> {
	(taskApi: TaskApi<TState>): TResult;
}

export interface TaskApi<TState> {
	dispatch: (actionOrTask: Action) => void;
	getState: () => TState;
	nextAction: () => Promise<SomeAction>;
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
}

export interface Dispatch<TAction extends Action = Action, TState = unknown> {
	(action: TAction): void;
	<TResult>(task: TaskFn<TState, TResult>): TResult;
}

export interface Reducer<TState, TAction> {
	(
		state: TState | undefined,
		action: TAction,
		schedule: SetTask<TState>,
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

export type AnyActionMaker = ActionMaker<Action, any[]>;

export type AnyActionPartMaker =
	| { (...args: any[]): { payload: any } }
	| { (): void };

export type MadeAction<TType, TMaker extends AnyActionPartMaker> = Pretty<
	{ type: Extract<TType, string> } & ReturnType<TMaker>
>;

export type CompleteActionMaker<
	TType,
	TMaker extends AnyActionPartMaker,
> = ActionMaker<MadeAction<TType, TMaker>, Parameters<TMaker>>;

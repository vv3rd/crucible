export interface Action<T extends string = string> {
	type: T;
}

export interface SomeAction extends Action {
	[extraProps: string]: unknown;
}

export interface Matchable<T extends Action> {
	match: (actionLike: Action) => actionLike is T;
}

export type InferMatch<M extends Matchable<any>> = M extends Matchable<infer T>
	? T
	: never;

export interface ActionDef<A extends Action = Action, I extends any[] = []>
	extends Matchable<A> {
	(...inputs: I): A;
	type: A["type"];
}

export interface AnyActionDef extends ActionDef<Action, any[]> {}

export interface PayloadDef {
	(...args: any[]): { payload: any };
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

export interface Dispatch<TAction = Action, TState = unknown> {
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

export interface Action<T extends string = string> {
	type: T;
}

export interface SomeAction extends Action {
	[extraProps: string]: unknown;
}

export interface ActionDef<A extends Action = Action, I extends any[] = []> {
	(...inputs: I): A;
	type: A["type"];
	match: (actionLike: Action) => actionLike is A;
}

export interface AnyActionDef<
	A extends Action = Action,
	I extends any[] = any[],
> extends ActionDef<A, I> {}

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
	(state: TState, action: TAction, schedule: SetTask<TState>): TState;
}

import { FUCK_TASK_POOL_CLOSED } from "./Errors";
import { AnyMsg, Msg } from "./Message";
import { AnyStore, Store } from "./Store";

export type AnyTask<R = any> = Task<any, R, AnyMsg>;
export interface Task<TResult, TState, TMsg extends Msg, TCtx> {
    (Task_store: Store<TState, TMsg>, signal: AbortSignal): TResult;
}

export interface TaskOfStore<TResult, TStore extends AnyStore> {
    (Task_store: TStore, signal: AbortSignal): TResult;
}

export namespace Task {
    export const pool = <TResult, TState, TMsg extends Msg>() => {
        const tasks: Task<TResult, TState, TMsg>[] = [];
        let scheduler = tasks.push.bind(tasks);
        const lockedScheduler = () => {
            throw new Error(FUCK_TASK_POOL_CLOSED);
        };
        return {
            [Symbol.iterator]() {
                return tasks[Symbol.iterator]();
            },
            getScheduler(): typeof scheduler {
                return (task) => scheduler(task);
            },
            lockScheduler() {
                scheduler = lockedScheduler;
            },
        };
    };
}

export interface TaskScheduler<TState, TMsg extends Msg> {
    (TaskScheduler_taskFn: Task<void, TState, TMsg>): void;
}
export namespace TaskScheduler {
    export const scoped =
        <TStateA, TStateB, TMsg extends Msg>(
            unscopedScheduler: TaskScheduler<TStateA, TMsg>,
            selector: (state: TStateA) => TStateB,
        ): TaskScheduler<TStateB, TMsg> =>
        (taskFn) => {
            unscopedScheduler((store, signal) => taskFn(Store.scoped(store, selector), signal));
        };
}

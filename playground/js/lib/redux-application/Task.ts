import { FUCK_TASK_POOL_CLOSED } from "./Errors";
import { AnyStore, Store } from "./Store";

export type AnyTask<R = any> = Task<any, R>;
export interface Task<TResult, TState > {
    (Task_store: Store<TState>, signal: AbortSignal): TResult;
}

export interface TaskOfStore<TResult, TStore extends AnyStore> {
    (Task_store: TStore, signal: AbortSignal): TResult;
}

export namespace Task {
    export const pool = <TResult, TState>() => {
        const tasks: Task<TResult, TState>[] = [];
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

export interface TaskScheduler<TState> {
    (TaskScheduler_taskFn: Task<void, TState>): void;
}
export namespace TaskScheduler {
    export const scoped =
        <TStateA, TStateB>(
            unscopedScheduler: TaskScheduler<TStateA>,
            selector: (state: TStateA) => TStateB,
        ): TaskScheduler<TStateB> =>
        (taskFn) => {
            unscopedScheduler((store, signal) => taskFn(Store.scoped(store, selector), signal));
        };
}

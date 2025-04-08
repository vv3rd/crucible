import { FUCK_TASK_POOL_CLOSED } from "./Errors";
import { AnyMsg, Msg } from "./Message";
import { Store } from "./Store";

export type AnyTask<R = any> = Task<any, R, AnyMsg>;
export interface Task<TResult, TState, TMsg extends Msg> {
    (Task_store: Store<TState, TMsg>, signal: AbortSignal): TResult;
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

export function taskExt<T, TMsg extends Msg>(store: Store<T, TMsg>) {
    async function condition(checker: (state: T) => boolean): Promise<T>;

    async function condition<U extends T>(checker: (state: T) => state is U): Promise<U>;
    async function condition(checker: (state: T) => boolean): Promise<T> {
        let state = store.getState();
        while (!checker(state)) {
            await store.nextMessage();
            state = store.getState();
        }
        return state;
    }

    async function take<T extends Msg>(matcher: Msg.Matcher<T>): Promise<T> {
        let awaitedMessage: T | undefined;
        while (awaitedMessage === undefined) {
            const msg = await store.nextMessage();
            if (matcher.match(msg)) {
                awaitedMessage = msg;
            }
        }
        return awaitedMessage;
    }

    async function* stream(): AsyncGenerator<Msg, void, void> {
        while (true) yield await store.nextMessage();
    }

    return {
        ...store,
        condition,
        take,
        stream,
    };
}

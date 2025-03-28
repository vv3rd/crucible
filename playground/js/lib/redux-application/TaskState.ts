import { Msg, MsgGroup, MsgWith } from "./Message";
import { Reducer } from "./Reducer";
import { Task, TaskControls } from "./Task";

interface IdleTask {
    taskIsRunning: false;
    taskIsFinished: false;
    taskResult: undefined;
}

interface RunningTask {
    taskIsRunning: true;
    taskIsFinished: false;
    taskResult: undefined;
}

interface FinishedTask<Value> {
    taskIsRunning: false;
    taskIsFinished: true;
    taskResult: TaskResult<Value>;
}

interface TaskSuccess<Value> {
    successful: true;
    value: Value;
    error: never;
}

interface TaskFailure {
    successful: false;
    value: never;
    error: Error;
}

type TaskResult<T> = TaskSuccess<T> | TaskFailure;

export type TaskState<T> = IdleTask | RunningTask | FinishedTask<T>;

// Namespace for task state operations
export namespace TaskState {
    // Utility functions to create task states
    export const idle = (): IdleTask => ({
        taskIsRunning: false,
        taskIsFinished: false,
        taskResult: undefined,
    });

    export const running = (): RunningTask => ({
        taskIsRunning: true,
        taskIsFinished: false,
        taskResult: undefined,
    });

    export const success = <T>(value: T): FinishedTask<T> => ({
        taskIsRunning: false,
        taskIsFinished: true,
        taskResult: {
            successful: true,
            value,
            error: undefined as never,
        },
    });

    export const failure = (error: unknown): FinishedTask<never> => {
        let err: Error;
        if (typeof error === "string") {
            err = new Error(error);
        }
        if (error instanceof Error) {
            err = error;
        } else {
            err = new Error("Non-Error task failure", { cause: error });
        }
        return {
            taskIsRunning: false,
            taskIsFinished: true,
            taskResult: {
                successful: false,
                value: undefined as never,
                error: err,
            },
        };
    };

    export function createReducer<TValue = void>(
        reducerName: string,
        extraCases: Partial<{
            succeeded: Msg.Matcher<MsgWith<TValue>>;
            failed: Msg.Matcher<MsgWith<unknown>>;
            started: Msg.Matcher<Msg>;
            reset: Msg.Matcher<Msg>;
        }> = {},
    ) {
        const messages = MsgGroup.create(reducerName, (msg) => [
            msg("started"),
            msg("succeeded").withPayload<TValue>(),
            msg("failed").withPayload<unknown>(),
            msg("reset"),
        ]);

        const reducer: Reducer<TaskState<TValue>, Msg> = (state = idle(), msg) => {
            if (messages.started.match(msg) || extraCases.started?.match(msg)) {
                return running();
            }
            if (messages.succeeded.match(msg) || extraCases.succeeded?.match(msg)) {
                return success(msg.payload);
            }
            if (messages.failed.match(msg) || extraCases.failed?.match(msg)) {
                return failure(msg.payload);
            }
            if (messages.reset.match(msg) || extraCases.reset?.match(msg)) {
                return idle();
            }
            return state;
        };

        const execute = (
            taskFn: (ctl: TaskControls<TaskState<TValue>>) => Promise<TValue>,
        ): Task<TaskState<TValue>, void> => {
            return async (ctl) => {
                ctl.dispatch(messages.started());

                try {
                    const result = await taskFn(ctl);
                    ctl.dispatch(messages.succeeded(result));
                } catch (error: any) {
                    if (typeof error === "string") {
                        error = new Error(error);
                    }
                    if (!(error instanceof Error)) {
                        error = new Error("Non-Error task failure", { cause: error });
                    }
                    ctl.dispatch(messages.failed(error));
                }
            };
        };

        return Object.assign(reducer, {
            messages,
            reducer,
            execute,
            reducerName: reducerName,
        });
    }
}

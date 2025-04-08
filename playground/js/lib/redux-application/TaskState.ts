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
}

interface IdleTask {
    running: false;
    finished: false;
    result: undefined;
}

interface RunningTask {
    running: number;
    finished: false;
    result: undefined;
}

interface FinishedTask<Value> {
    running: number | false;
    finished: number;
    result: TaskResult<Value>;
}

interface TaskSuccess<Value> {
    successful: true;
    value: Value;
    error: void;
}

interface TaskFailure {
    successful: false;
    value: void;
    error: Error;
}

type TaskResult<T> = TaskSuccess<T> | TaskFailure;

export type TaskState<T> = IdleTask | RunningTask | FinishedTask<T>;

// Namespace for task state operations
export namespace TaskState {
    // Utility functions to create task states
    export const idle = (): IdleTask => ({
        running: false,
        finished: false,
        result: undefined,
    });

    export const running = (startTime: Date | number): RunningTask => ({
        running: truthyTime(startTime),
        finished: false,
        result: undefined,
    });

    export const success = <T>(value: T, currentTime: Date | number): FinishedTask<T> => ({
        running: false,
        finished: truthyTime(currentTime),

        result: {
            successful: true,
            value,
            error: undefined,
        },
    });

    export const failure = (error: unknown, currentTime: Date | number): FinishedTask<never> => {
        let err: Error;
        if (typeof error === "string") {
            err = new Error(error);
            popStackLine(err);
        }
        if (error instanceof Error) {
            err = error;
        } else {
            err = new Error("Non-Error task failure", { cause: error });
            popStackLine(err)
        }
        return {
            running: false,
            finished: truthyTime(currentTime),
            result: {
                successful: false,
                value: undefined as never,
                error: err,
            },
        };
    };
}

const truthyTime = (time: Date | number) => (time == 0 ? -1 : Number(time));

const popStackLine = (error: Error) => {
    if (error.stack) {
        let stack = error.stack.split("\n");
        stack.splice(1, 1);
        error.stack = stack.join("\n");
    }
};

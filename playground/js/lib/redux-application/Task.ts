import { FUCK_TASK_POOL_CLOSED } from "./Errors";
import { Store } from "./Store";
import { Matchable, Message, AnyMessage } from "./types";

export type AnyTask<R = any> = Task<any, R>;
export interface Task<TState, TResult> {
	(Task_taskCtl: TaskControls<TState>): TResult;
}

export namespace Task {
	export const pool = <TState, TResult = void>() => {
		const tasks: Task<TState, TResult>[] = [];
		let scheduler = tasks.push.bind(tasks);
		const lockedScheduler = () => {
			throw new Error(FUCK_TASK_POOL_CLOSED);
		};
		return {
			getTasks() {
				scheduler = lockedScheduler;
				return [...tasks];
			},
			getScheduler(): typeof scheduler {
				return (task) => scheduler(task);
			},
			lockScheduler() {
				scheduler = lockedScheduler;
			},
		};
	};
	export type InferState<R> = R extends Task<infer S, any> ? S : never;

	export const run = <TState>(task: Task<TState, unknown>, store: Store<TState, AnyMessage>) => {
		const ac = new AbortController();
		const signal = ac.signal;
		const ctl: TaskControls<TState> = {
			...store,
			signal,
			subscribe(listener) {
				const unsubscribe = store.subscribe(listener);
				signal.addEventListener("abort", unsubscribe);
				return unsubscribe;
			},
		};
		(async () => {
			try {
				await task(ctl);
			} finally {
				ac.abort();
			}
		})();
	};
}

export interface TaskControls<TState> extends Store<TState, AnyMessage> {
	signal: AbortSignal;
}

export namespace TaskControls {
	export const scoped = <TStateA, TStateB>(
		ctl: TaskControls<TStateA>,
		selector: (state: TStateA) => TStateB,
	): TaskControls<TStateB> => {
		return {
			...ctl,
			getState: () => selector(ctl.getState()),
		};
	};
}

export interface TaskScheduler<TState> {
	(TaskScheduler_taskFn: Task<TState, void>): void;
}
export namespace TaskScheduler {
	export const scoped =
		<TStateA, TStateB>(
			unscopedScheduler: TaskScheduler<TStateA>,
			selector: (state: TStateA) => TStateB,
		): TaskScheduler<TStateB> =>
		(taskFn) => {
			unscopedScheduler((ctl) => taskFn(TaskControls.scoped(ctl, selector)));
		};
}

export function taskExt<T>(ctl: TaskControls<T>) {
	async function condition(checker: (state: T) => boolean): Promise<T>;

	async function condition<U extends T>(checker: (state: T) => state is U): Promise<U>;
	async function condition(checker: (state: T) => boolean): Promise<T> {
		let state = ctl.getState();
		while (!checker(state)) {
			await ctl.nextMessage();
			state = ctl.getState();
		}
		return state;
	}

	async function take<T extends Message>(matcher: Matchable<T>): Promise<T> {
		let awaitedMessage: T | undefined;
		while (awaitedMessage === undefined) {
			const msg = await ctl.nextMessage();
			if (matcher.match(msg)) {
				awaitedMessage = msg;
			}
		}
		return awaitedMessage;
	}

	async function* stream(): AsyncGenerator<Message, void, void> {
		while (true) yield await ctl.nextMessage();
	}

	return {
		...ctl,
		condition,
		take,
		stream,
	};
}

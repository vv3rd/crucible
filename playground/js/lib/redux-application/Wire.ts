// Wire is a primitive or a tool to help "wiring up" redux/elm application
// Draft of an idea: { select(stateRoot): T; address(...): ??? } is the primitive to
// be used by state consumers, making reducers discoverable is a part of lightening the work
// of wiring up application.

import { defineMessageKind, withPayload } from "./Message";
import { Reducer } from "./Reducer";
import { TaskApi, TaskFn } from "./Task";
import { Message, StateRoot } from "./types";

const wiringMsg = defineMessageKind("wiring", {
	probe: withPayload<{
		task: <S, M extends Message>(
			wireId: string,
		) => (api: TaskApi<S, M>) => void;
	}>,
});

function createWired<TState, TMsg extends Message>(
	reducer: Reducer<TState, TMsg>,
): Reducer<TState, TMsg> {
	const wireId = Math.random().toString(36).substring(2);
	return (state, msg, schedule) => {
		if (wiringMsg.match(msg)) {
			schedule(msg.payload.task<TState, TMsg>(wireId));
		}
		return reducer(state, msg, schedule);
	};
}

function createWiresRoot(reducer: Reducer<WiredStateRoot, any>) {
	const wireMeta: Record<string, (state: WiredStateRoot) => unknown> = {};
	const probe = wiringMsg.probe({
		task: (wireId) => (api) => {
			wireMeta[wireId] = createWireSelector(api.getState);
		},
	});
	const tasks: TaskFn<WiredStateRoot, any, void>[] = [];
	let scheduler = tasks.push.bind(tasks);
	reducer(undefined, probe, scheduler);
	for (const task of tasks) {
		task({
			signal: AbortSignal.timeout(0),
			dispatch() {
				throw new Error("Forbidden");
			},
			nextMessage() {
				throw new Error("Forbidden");
			},
			getState() {
				return stateGetter();
			},
		});
	}

	let stateGetter = function lockedStateGetter(): WiredStateRoot {
		throw new Error(
			"This should not happen unless you doing something " +
				"very wrong with scoping TaskScheduler-s or TaskApi-s",
		);
	};

	const createWireSelector = (getState: () => unknown) => {
		return (rootState: WiredStateRoot) => {
			const previous = stateGetter;
			stateGetter = () => rootState;
			try {
				return getState();
			} finally {
				stateGetter = previous;
			}
		};
	};

	const wiresRootReducer: Reducer<WiredStateRoot, any> = (
		state,
		msg,
		schedule,
	) => {
		state = reducer(state, msg, schedule);
		if (!(wiring in state)) {
			return { ...state, [wiring]: wireMeta };
		}
		return state;
	};

	return wiresRootReducer;
}

const wiring = Symbol();

interface WiredStateRoot extends StateRoot {
	readonly [wiring]?: Record<string, (state: WiredStateRoot) => unknown>;
}

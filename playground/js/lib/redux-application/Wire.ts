import { FUCK_TASK_NOT_REAL } from "./Errors";
import { Msg } from "./Message";
import { Reducer } from "./Reducer";
import { TaskApi, TaskFn } from "./Task";
import { Message, StateRoot } from "./types";

const probeKey = Symbol();
// type WireProbe = ReturnType<typeof WireProbeMsg>;
type ProbeTask = <S>(wireId: string) => (api: TaskApi<S>) => void;

const WireProbeMsg = Msg.ofType("@wiring/probe").withPayload(
	(task: ProbeTask) => ({ [probeKey]: task }),
);

const wiringKey = Symbol();
interface WiringRoot extends StateRoot {
	readonly [wiringKey]?: Record<string, (state: WiringRoot) => unknown>;
}

export function createWired<TState, TMsg extends Message>(
	reducer: Reducer<TState, TMsg>,
): Reducer<TState, TMsg> {
	const wireId = Math.random().toString(36).substring(2);
	// TODO: implement this
	// const select = (root: WiringRoot) => {
	// 	const selector = root?.[wiringKey]?.[wireId];

	// 	return selector?.(root);
	// };
	return (state, msg, schedule) => {
		if (WireProbeMsg.match(msg)) {
			schedule(msg.payload[probeKey]<TState>(wireId));
		}
		return reducer(state, msg, schedule);
	};
}

export function createWiringRoot(reducer: Reducer<WiringRoot, any>) {
	const wireMeta: Record<string, (state: WiringRoot) => unknown> = {};
	const probeMsg = WireProbeMsg((wireId) => (api) => {
		wireMeta[wireId] = createWireSelector(api.getState);
	});
	const tpb = TaskFn.pool<WiringRoot, any>();
	try {
		reducer(undefined, probeMsg, tpb.getScheduler());
	} finally {
		tpb.lockScheduler();
	}
	for (const task of tpb.getTasks()) {
		task({ ...stubTaskApi, getState: () => stateGetter() });
	}

	let stateGetter = function lockedStateGetter(): WiringRoot {
		throw new Error(
			"This should not happen unless you doing something " +
				"very wrong with scoping TaskScheduler-s or TaskApi-s",
		);
	};

	const createWireSelector = (getState: () => unknown) => {
		return (rootState: WiringRoot) => {
			const previous = stateGetter;
			stateGetter = () => rootState;
			try {
				return getState();
			} finally {
				stateGetter = previous;
			}
		};
	};

	const wiringRootReducer: Reducer<WiringRoot, any> = (
		state,
		msg,
		schedule,
	) => {
		state = reducer(state, msg, schedule);
		if (!(wiringKey in state)) {
			state = { ...state, [wiringKey]: wireMeta };
		}
		return state;
	};

	return wiringRootReducer;
}

const stubTaskApi: TaskApi<any> = {
	signal: AbortSignal.abort(),
	dispatch() {
		throw new Error(FUCK_TASK_NOT_REAL);
	},
	nextMessage() {
		throw new Error(FUCK_TASK_NOT_REAL);
	},
	getState() {
		throw new Error(FUCK_TASK_NOT_REAL);
	},
};

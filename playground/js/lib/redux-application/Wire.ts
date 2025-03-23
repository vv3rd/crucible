import { FUCK_TASK_NOT_REAL } from "./Errors";
import { Msg } from "./Message";
import { Reducer } from "./Reducer";
import { TaskControls, Task } from "./Task";
import { Message, StateRoot } from "./types";

const probeKey = Symbol();
// type WireProbe = ReturnType<typeof WireProbeMsg>;
type ProbeTask = <S>(wireId: string) => (api: TaskControls<S>) => void;

const WireProbe = Msg.ofType("_WireProbe_").withPayload((task: ProbeTask) => ({
	[probeKey]: task,
}));

const wiringKey = Symbol();
export interface WiringRoot extends StateRoot {
	readonly [wiringKey]?: Record<string, (state: WiringRoot) => unknown>;
}

export interface WiredReducer<TState, TMsg extends Message> extends Reducer<TState, TMsg> {
	select: (root: WiringRoot) => TState;
}

export function createWired<TState, TMsg extends Message>(
	reducer: Reducer<TState, TMsg>,
): WiredReducer<TState, TMsg> {
	const wireId = Math.random().toString(36).substring(2);
	const wiredReducer: WiredReducer<TState, TMsg> = (state, msg, schedule) => {
		if (WireProbe.match(msg)) {
			schedule(msg.payload[probeKey]<TState>(wireId));
		}
		return reducer(state, msg, schedule);
	};
	wiredReducer.select = (root: WiringRoot) => {
		const wiringMeta = root[wiringKey];
		const selector = wiringMeta?.[wireId];
		const output = selector?.(root);
		return output as TState;
	};
	return wiredReducer;
}

export function createWiringRoot(reducer: Reducer<WiringRoot, any>) {
	const wireMeta: Record<string, (state: WiringRoot) => unknown> = {};
	const probeMsg = WireProbe((wireId) => (api) => {
		wireMeta[wireId] = createWireSelector(api.getState);
	});
	const tpb = Task.pool<WiringRoot, any>();
	try {
		reducer(undefined, probeMsg, tpb.getScheduler());
	} finally {
		tpb.lockScheduler();
	}
	for (const task of tpb.getTasks()) {
		task({ ...stubTaskControls, getState: () => stateGetter() });
	}

	let stateGetter = function lockedStateGetter(): WiringRoot {
		throw new Error(
			"This should not happen unless you doing something " +
				"very wrong with scoping TaskScheduler-s or TaskControls-s",
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

	const wiringRootReducer: Reducer<WiringRoot, any> = (state, msg, schedule) => {
		state = reducer(state, msg, schedule);
		if (!(wiringKey in state)) {
			state = { ...state, [wiringKey]: wireMeta };
		}
		return state;
	};

	return wiringRootReducer;
}

// biome-ignore format:
const stubTaskControls: TaskControls<any> = {
    signal: AbortSignal.abort(),
    lastMessage: Msg.empty,
    dispatch() { throw new Error(FUCK_TASK_NOT_REAL); },
    nextMessage() { throw new Error(FUCK_TASK_NOT_REAL); },
    getState() { throw new Error(FUCK_TASK_NOT_REAL); },
    subscribe() { throw new Error(FUCK_TASK_NOT_REAL); },
    unsubscribe() { throw new Error(FUCK_TASK_NOT_REAL); }
};

import { Msg } from "./Message";
import { Reducer } from "./Reducer";
import { TaskApi, TasksPool } from "./Task";
import { Message, StateRoot } from "./types";

const probeKey = Symbol();
type WireProbe = ReturnType<typeof WireProbe>;
type ProbeTask = <S, M extends Message>(
	wireId: string,
) => (api: TaskApi<S, M>) => void;

const WireProbe = Msg.ofType("@wiring/probe").withPayload<{
	[probeKey]: ProbeTask;
}>();

const wiringKey = Symbol();
interface WiringRoot extends StateRoot {
	readonly [wiringKey]?: Record<string, (state: WiringRoot) => unknown>;
}

export function createWired<TState, TMsg extends Message>(
	reducer: Reducer<TState, TMsg>,
): Reducer<TState, TMsg> {
	const wireId = Math.random().toString(36).substring(2);
	const select = (root: WiringRoot) => {
		const selector = root?.[wiringKey]?.[wireId];

		return selector?.(root);
	};
	return (state, msg, schedule) => {
		if (WireProbe.match(msg)) {
			schedule(msg.payload[probeKey]<TState, TMsg>(wireId));
		}
		return reducer(state, msg, schedule);
	};
}

export function createWiringRoot(reducer: Reducer<WiringRoot, any>) {
	const wireMeta: Record<string, (state: WiringRoot) => unknown> = {};
	const probe = WireProbe({
		[probeKey]: (wireId) => (api) => {
			wireMeta[wireId] = createWireSelector(api.getState);
		},
	});
	const tpb = TasksPool.builder<WiringRoot, any>();
	try {
		reducer(undefined, probe, tpb.getScheduler());
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

const stubTaskApi = {
	signal: AbortSignal.timeout(0),
	dispatch() {
		throw new Error("Forbidden");
	},
	nextMessage() {
		throw new Error("Forbidden");
	},
};

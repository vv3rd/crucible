import { FUCK_TASK_NOT_REAL } from "./Errors";
import { Msg } from "./Message";
import { Reducer } from "./Reducer";
import { AnyStore } from "./Store";
import { Task, TaskScheduler } from "./Task";

export namespace Wire {}

const probeKey = Symbol();
const probeMsg = Msg.ofType(`wire-${Math.round(Math.random() * 100)}`).withPayload(
    (task: <S>(wireId: string) => (api: AnyStore) => void) => ({
        [probeKey]: task,
    }),
);

const wiringKey = Symbol();
export interface WiringRoot {
    readonly [wiringKey]?: Record<string, (state: WiringRoot) => unknown>;
}

export interface WiredReducer<TState, TMsg extends Msg> extends Reducer<TState, TMsg> {
    select: (root: WiringRoot) => TState;
}

export function createWireUtils<TState, TMsg extends Msg>() {
    const wireId = Math.random().toString(36).substring(2);
    function connectWire(msg: Msg, exec: TaskScheduler<TState, TMsg>) {
        if (probeMsg.match(msg)) {
            exec(msg.payload[probeKey](wireId));
        }
    }
    function selectSelf(root: WiringRoot) {
        const wiringMeta = root[wiringKey];
        const selector = wiringMeta?.[wireId];
        const output = selector?.(root);
        return output as TState;
    }

    return [connectWire, selectSelf] as const;
}

export function createWire<TState, TMsg extends Msg>(
    reducer: Reducer<TState, TMsg>,
): WiredReducer<TState, TMsg> {
    const [connect, selectSelf] = createWireUtils<TState, TMsg>();
    const wiredReducer: WiredReducer<TState, TMsg> = (state, msg, schedule) => {
        connect(msg, schedule);
        return reducer(state, msg, schedule);
    };
    wiredReducer.select = selectSelf;
    return wiredReducer;
}

export function createWiringRoot<TState extends object, TMsg extends Msg>(
    reducer: Reducer<TState, TMsg>,
) {
    type WiredState = WiringRoot & TState;
    const wireMeta: Record<string, (state: WiredState) => unknown> = {};
    const probe = probeMsg((wireId) => (api) => {
        wireMeta[wireId] = createWireSelector(api.getState);
    });
    const tasks = Task.pool<any, WiredState, any>();
    try {
        reducer(undefined, probe as any, tasks.getScheduler());
    } finally {
        tasks.lockScheduler();
    }
    const signal = AbortSignal.abort();
    for (const task of tasks) {
        task({ ...stubTaskControls, getState: () => stateGetter() }, signal);
    }

    let stateGetter = function lockedStateGetter(): WiredState {
        throw new Error(
            "This should not happen unless you doing something " +
                "very wrong with scoping TaskScheduler-s or TaskControls-s",
        );
    };

    function createWireSelector(getState: () => unknown) {
        return (rootState: WiredState) => {
            const previous = stateGetter;
            stateGetter = () => rootState;
            try {
                return getState();
            } finally {
                stateGetter = previous;
            }
        };
    }

    const wiringRootReducer: Reducer<WiredState, TMsg> = (state, msg, schedule) => {
        state = reducer(state, msg, schedule);
        if (!(wiringKey in state)) {
            state = { ...state, [wiringKey]: wireMeta };
        }
        return state;
    };

    return wiringRootReducer;
}

// biome-ignore format:
const stubTaskControls: AnyStore = {
    context: {},
    execute() { throw new Error(FUCK_TASK_NOT_REAL); },
    catch() { throw new Error(FUCK_TASK_NOT_REAL); },
    dispatch() { throw new Error(FUCK_TASK_NOT_REAL); },
    getState() { throw new Error(FUCK_TASK_NOT_REAL); },
    subscribe() { throw new Error(FUCK_TASK_NOT_REAL); },
    unsubscribe() { throw new Error(FUCK_TASK_NOT_REAL); }
    // lastMessage() { throw new Error(FUCK_TASK_NOT_REAL); },
    // nextMessage() { throw new Error(FUCK_TASK_NOT_REAL); },
};

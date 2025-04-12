import { Msg, MsgWith } from "./Message";
import { Store } from "./Store";
import { Task, TaskScheduler } from "./Task";
import { isPlainObject, TODO } from "./utils";

enum CacheStatus {
    Initial,
    Pending,
    Receiving,
    Failed,
    Closed,
}

enum TaskStatus {
    Idle,
    Paused,
    Running,
}

// biome-ignore format:
type CacheResultsForStatus<R> = {
	[CacheStatus.Initial]:   { data: undefined;     error: undefined };
	[CacheStatus.Pending]:   { data: undefined;     error: undefined };
	[CacheStatus.Receiving]: { data: R;             error: undefined };
	[CacheStatus.Closed]:    { data: R;             error: undefined };
	[CacheStatus.Failed]:    { data: R | undefined; error: Error     };
};

type DataForStatus<S extends CacheStatus, R> = CacheResultsForStatus<R>[S]["data"];
type ErrorForStatus<S extends CacheStatus, R> = CacheResultsForStatus<R>[S]["error"];

interface CacheMeta {
    dataUpdatedAt: number;
    errorUpdatedAt: number;
}

interface CacheLike<R> {
    taskStatus: TaskStatus;
    status: CacheStatus;
    data: DataForStatus<this["status"], R>;
    error: ErrorForStatus<this["status"], R>;
}

interface SomeCache<R> extends CacheLike<R>, CacheMeta {}

interface InitialCache<R> extends SomeCache<R> {
    status: CacheStatus.Initial;
}
interface PendingCache<R> extends SomeCache<R> {
    status: CacheStatus.Pending;
}
interface ClosedCache<R> extends SomeCache<R> {
    status: CacheStatus.Closed;
}
interface ReceivingCache<R> extends SomeCache<R> {
    status: CacheStatus.Receiving;
}
interface FailedCache<R> extends SomeCache<R> {
    status: CacheStatus.Failed;
}

export type Cache<R> =
    | InitialCache<R>
    | PendingCache<R>
    | ReceivingCache<R>
    | FailedCache<R>
    | ClosedCache<R>;

namespace Cache {
    type PredicatedBy<Fn> = Fn extends (arg: any) => arg is infer T ? T : never;
    export const isResolved = <R>(
        resource: Cache<R>,
    ): resource is Extract<Cache<R>, { status: CacheStatus.Receiving | CacheStatus.Closed }> => {
        return resource.status === CacheStatus.Receiving || resource.status === CacheStatus.Closed;
    };

    export const isSettled = <R>(
        resource: Cache<R>,
    ): resource is Exclude<Cache<R>, { status: CacheStatus.Initial | CacheStatus.Pending }> => {
        return resource.status !== CacheStatus.Initial && resource.status !== CacheStatus.Pending;
    };
    export const isPending = <R>(
        resource: Cache<R>,
    ): resource is Exclude<Cache<R>, PredicatedBy<typeof isSettled>> => {
        return !isSettled(resource);
    };

    export const initial = <TData>(): InitialCache<TData> => ({
        data: undefined,
        error: undefined,
        dataUpdatedAt: 0,
        errorUpdatedAt: 0,
        status: CacheStatus.Initial,
        taskStatus: TaskStatus.Idle,
    });
}

interface CacheLifetime<TData> {
    shouldInvalidate: (instance: Cache<TData>, msg: Msg) => boolean;
    shouldDiscard: (instance: Cache<TData>, msg: Msg) => boolean;
    shouldSet: (instance: Cache<TData>, msg: Msg) => msg is MsgWith<TData>;
}

interface CacheDataStructure<TData> {
    append: (current: TData, incomming: TData) => TData;
    match: (current: TData, incomming: TData) => boolean;
}

interface CacheSetup<TData, TIn> {
    name: string;
    fetch: (input: TIn) => CacheFetchTask<TData>;
    lifetime: CacheLifetime<TData>;
    structure: CacheDataStructure<TData>;
}

interface CacheSetupFacade<TData, TIn> {
    name: string;
    fetch: (input: TIn, api: Store<Cache<TData>>, signal: AbortSignal) => OptionalPromise<TData>;
}

type OptionalPromise<T> = void | Promise<void | T>;

type CacheFetchTask<TData> = Task<OptionalPromise<TData>, Cache<TData>>;

interface CacheState<TData, TIn> {
    fresh: {
        [key in string]: Cache<TData>;
    };
    stale: {
        [key in string]: Cache<TData>;
    };
}

function createCacheImpl<TData, TIn>(setup: CacheSetup<TData, TIn>) {
    const { name: cacheName, fetch: fetchData, lifetime, structure } = setup;
    type TCacheState = CacheState<TData, TIn>;
    type TCache = Cache<TData>;

    function createCahce(key: string, instance: TCache): TCacheState {
        return { fresh: { [key]: instance }, stale: {} };
    }

    function resourceIsObserved(msg: Msg): msg is MsgWith<TIn> {
        TODO();
    }

    function resourceIsUnobserved(msg: Msg): boolean {
        TODO();
    }

    function instanceIsStale(instance: TCache): boolean {
        TODO();
    }

    function observe(input: TIn): CacheFetchTask<TData> {
        let key = inputsToKey(input)
        return (scope, signal) => {
            
        }
    }

    function reduceCache(
        state: TCacheState | null = null,
        msg: Msg,
        schedule: TaskScheduler<TData>,
    ): TCacheState | null {
        if (resourceIsObserved(msg)) {
            let key = inputsToKey(msg.payload);
            let instance = state && state.fresh[key];
            if (instance == null) {
                instance = Cache.initial();
            }
            if (instance.status === CacheStatus.Initial) {
                schedule(({ dispatch }) => {});
                // instance = 
            }
            if (state == null) {
                state = createCahce(key, instance);
            }
            return state;
        }

        if (resourceIsUnobserved(msg)) {
        }

        return state;
    }
}

function inputsToKey(inputs: unknown) {
    if (inputs == null) {
        return "-";
    }
    if (typeof inputs === "object") {
        return sortStringify(inputs);
    }
    return String(inputs);
}

function sortStringify(inputs: object) {
    return JSON.stringify(inputs, (_, original) => {
        if (isPlainObject(original)) {
            const keys = Object.keys(original).sort();
            const sorted: any = {};
            for (const key of keys) {
                sorted[key] = original[key];
            }
            return sorted;
        } else {
            return original;
        }
    });
}
/*
TODO: consider
1. what request to prefer, the one currently pending or the one dispatched later
2. need for manual writes to the cache and what to do with pending requests if a write occurs

*/

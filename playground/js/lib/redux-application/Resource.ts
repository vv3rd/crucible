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
}

interface CacheState<TData> {
    keyed: {
        [key in string]: Cache<TData>;
    };
}

/*
TODO: consider
1. what request to prefer, the one currently pending or the one dispatched later
2. need for manual writes to the cache and how to do with pending requests if a write occurs

*/

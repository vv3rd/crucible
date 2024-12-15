import {
	createContext,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";

type Real = NonNullable<unknown>;

const GlobalResourceCache = new Map<string, ResourceSubscription<any>>();

const ResourceCacheContext = createContext(GlobalResourceCache);

export function useResource<TKey extends Real, TData>(
	key: TKey,
	fetcher: (key: TKey) => Promise<TData>,
): Resource<TData> {
	key = useShallowMemo(key);
	const keyHash = useMemo(() => hashKey(key), [key]);

	const cache = useContext(ResourceCacheContext);

	const [subscription, setSubscription] = useState(() => {
		let subscription = cache.get(keyHash);
		if (!subscription) {
			subscription = {
				keyHash: keyHash,
				count: 0,
				store: createStore(Resource.initial<TData>()),
				promise: null,
			};
			cache.set(keyHash, subscription);
		}
		return subscription;
	});

	const [state, setState] = useState(() => {
		return subscription.store.get();
	});

	useEffect(() => {
		if (subscription.promise === null) {
			const promise = fetcher(key)
				.then((result) => {
					// subscription.store.set()
				})
				.catch((err) => {})
				.finally(() => {});
			setSubscription({ ...subscription, promise: promise });
		}
	}, [cache, key, keyHash]);

	throw new Error("Not implemented");
}

type ResourceSubscription<T> = {
	keyHash: string;
	count: number;
	store: Store<Resource<T>>;
	promise: null | Promise<T>;
};

type Store<T> = {
	sub: (callback: (val: T) => void) => () => void;
	get: () => T;
	set: (val: T) => void;
};

const createStore = <T>(value: T): Store<T> => {
	const listeners = new Set<(val: T) => void>();
	const notify = (value: T) => {
		const errors = [] as unknown[];
		for (const listener of listeners) {
			try {
				listener(value);
			} catch (err) {
				errors.push(err);
			}
		}
		if (errors.length > 1) {
			throw new AggregateError(errors);
		}
		if (errors.length > 0) {
			throw errors[0];
		}
	};
	const store: Store<T> = {
		get: () => value,
		set(val) {
			value = val;
			notify(val);
		},
		sub(callback) {
			listeners.add(callback);
			return () => {
				listeners.delete(callback);
			};
		},
	};
	return store;
};

export function useShallowMemo<T extends object>(newValue: T): T {
	const storedValue = useRef(newValue);

	for (const [key, value] of Object.entries(newValue)) {
		if (storedValue.current[key as keyof T] !== value) {
			storedValue.current = newValue;
			return newValue;
		}
	}

	return storedValue.current;
}

export function hashKey(queryKey: object): string {
	return JSON.stringify(queryKey, (_, val) => {
		if (isPlainObject(val)) {
			return Object.fromEntries(
				Object.keys(val)
					.sort()
					.map((key) => [key, val[key]]),
			);
		} else {
			return val;
		}
	});
}

const { getPrototypeOf, prototype: ObjectPrototype } = Object;

export function isPlainObject(
	thing: any,
): thing is { [key: PropertyKey]: unknown } {
	return (
		getPrototypeOf(thing) === ObjectPrototype || getPrototypeOf(thing) === null
	);
}

export function usePrevious<T>(
	currentValue: T,
	equals: (a: T, b: T) => boolean = (a, b) => a === b,
): T | null {
	const swap = useMemo(
		() => ({
			willBePrevious: currentValue,
			previous: null as T | null,
		}),
		[],
	);

	if (!equals(currentValue, swap.willBePrevious)) {
		swap.previous = swap.willBePrevious;
		swap.willBePrevious = currentValue;
	}

	return swap.previous;
}

enum ResourceStatus {
	Pending = "pending",
	Failed = "failed",
	Done = "done",
}

enum TaskStatus {
	Idle = "idle",
	Running = "running",
}

type ResultsShape<D, E> = { data: D; error: E };
type ResourceResultsForStatus<R> = {
	[ResourceStatus.Pending]: ResultsShape<undefined, undefined>;
	[ResourceStatus.Failed]: ResultsShape<R | undefined, unknown>;
	[ResourceStatus.Done]: ResultsShape<R, undefined>;
};
type DataForStatus<
	S extends ResourceStatus,
	R,
> = ResourceResultsForStatus<R>[S]["data"];
type ErrorForStatus<
	S extends ResourceStatus,
	R,
> = ResourceResultsForStatus<R>[S]["error"];

interface ResourceMeta {
	dataUpdatedAt: Date | null;
	errorUpdatedAt: Date | null;
}

interface ResourceBackground {
	taskStatus: TaskStatus;
}

interface ResourceLike<R> {
	status: ResourceStatus;
	data: DataForStatus<this["status"], R>;
	error: ErrorForStatus<this["status"], R>;
	meta: ResourceMeta;
}

interface ResourceBase<R> extends ResourceLike<R>, ResourceBackground {}

interface PendingResource<R> extends ResourceBase<R> {
	status: ResourceStatus.Pending;
}
interface DoneResource<R> extends ResourceBase<R> {
	status: ResourceStatus.Done;
}
interface FailedResource<R> extends ResourceBase<R> {
	status: ResourceStatus.Failed;
}

export type Resource<R> =
	| PendingResource<R>
	| FailedResource<R>
	| DoneResource<R>;

namespace Resource {
	export const initial = <T>(): Resource<T> => ({
		data: undefined,
		error: undefined,
		status: ResourceStatus.Pending,
		taskStatus: TaskStatus.Idle,
		meta: {
			dataUpdatedAt: null,
			errorUpdatedAt: null,
		},
	});
}

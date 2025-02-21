import { MsgGroup } from "./Message";
import { Dict, Message } from "./types";
import { TaskApi, TaskFn } from "./Task";
import { nanoid } from "nanoid";
import { sortStringify } from "./utils";

enum ResourceStatus {
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
type ResourceResultsForStatus<R> = {
	[ResourceStatus.Initial]:   { data: undefined;     error: undefined };
	[ResourceStatus.Pending]:   { data: undefined;     error: undefined };
	[ResourceStatus.Receiving]: { data: R;             error: undefined };
	[ResourceStatus.Closed]:    { data: R;             error: undefined };
	[ResourceStatus.Failed]:    { data: R | undefined; error: Error     };
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
	dataUpdatedAt: number;
	errorUpdatedAt: number;
}

interface ResourceLike<R> {
	taskStatus: TaskStatus;
	status: ResourceStatus;
	data: DataForStatus<this["status"], R>;
	error: ErrorForStatus<this["status"], R>;
}

interface SomeResource<R> extends ResourceLike<R>, ResourceMeta {}

interface InitialResource<R> extends SomeResource<R> {
	status: ResourceStatus.Initial;
}
interface PendingResource<R> extends SomeResource<R> {
	status: ResourceStatus.Pending;
}
interface ClosedResource<R> extends SomeResource<R> {
	status: ResourceStatus.Closed;
}
interface ReceivingResource<R> extends SomeResource<R> {
	status: ResourceStatus.Receiving;
}
interface FailedResource<R> extends SomeResource<R> {
	status: ResourceStatus.Failed;
}

export type Resource<R> =
	| InitialResource<R>
	| PendingResource<R>
	| ReceivingResource<R>
	| FailedResource<R>
	| ClosedResource<R>;

namespace Resource {
	type PredicatedBy<Fn> = Fn extends (arg: any) => arg is infer T ? T : never;
	export const isResolved = <R>(
		resource: Resource<R>,
	): resource is Extract<
		Resource<R>,
		{ status: ResourceStatus.Receiving | ResourceStatus.Closed }
	> => {
		return (
			resource.status === ResourceStatus.Receiving ||
			resource.status === ResourceStatus.Closed
		);
	};

	export const isSettled = <R>(
		resource: Resource<R>,
	): resource is Exclude<
		Resource<R>,
		{ status: ResourceStatus.Initial | ResourceStatus.Pending }
	> => {
		return (
			resource.status !== ResourceStatus.Initial &&
			resource.status !== ResourceStatus.Pending
		);
	};
	export const isPending = <R>(
		resource: Resource<R>,
	): resource is Exclude<Resource<R>, PredicatedBy<typeof isSettled>> => {
		return !isSettled(resource);
	};
}

interface ResoruceTaskContext<R> {
	promisesCache: Map<string, Promise<Resource<R>>>;
}

interface ResourceSetup<TData, TInputs> {
	name: string;
	fetch: (inputs: TInputs) => Promise<TData>;
	hash?: (attributes: { name: string; inputs: TInputs }) => string;
	merge?: (current: TData, incomming: TData, inputs: TInputs) => TData;
	// lifetime?: Lifetime // { extended: Matchable, expired: Matchable }
	// validity?: Validity
}

function createResource<D, I>(setup: ResourceSetup<D, I>) {
	type DataMsg<T extends string, D> = Message<T> & D;
	type M = typeof resourceAct.T;
	return function resourceReducer(was: Resource<D>, msg: M) {
		switch (was.status) {
			case ResourceStatus.Initial:
			case ResourceStatus.Pending:
			case ResourceStatus.Receiving:
			case ResourceStatus.Failed:
			case ResourceStatus.Closed:
		}
	};

	function reducerInitial(was: InitialResource<D>, msg: M) {
		switch (msg.type) {
			case resourceAct.triggered.type: {
			}
		}
	}
}

type TGlobalState = {
	cache: Dict<Resource<any>>;
};

const messageAtResource = (key: string, taskId: string) => ({
		key,
		taskId,
});

const resourceAct = MsgGroup.create("cache", msg => [
	msg("triggered").withPayload(messageAtResource),
	msg('resolved').withPayload<{output: unknown, key: string}>(),
	msg('rejected').withPayload<{output: unknown; key: string}>(),
	msg("aborted").withPayload(messageAtResource),
	msg("updated").withPayload(messageAtResource),
])

function reduceResourceCache<R>() {}

function requireResource<T, R>(
	inputs: T,
	runner: (inputs: T) => Promise<R>,
	context: ResoruceTaskContext<R>,
): TaskFn<TGlobalState> {
	const key = sortStringify(inputs);

	return function taskWithCachedPromise(taskApi: TaskApi<TGlobalState>) {
		const runnningTaskPromise = context.promisesCache.get(key);
		if (runnningTaskPromise) {
			return runnningTaskPromise;
		} else {
			const promise = awaitResource(taskApi).finally(() => {
				context.promisesCache.delete(key);
			});
			context.promisesCache.set(key, promise);
			return promise;
		}
	};

	function selectOwnState(state: TGlobalState): Resource<R> {
		return state.cache[key]!;
	}

	async function awaitResource(
		globalTaskApi: TaskApi<TGlobalState>,
	): Promise<Resource<R>> {
		const { getState, dispatch, condition } = TaskApi.helper(
			TaskApi.scoped(globalTaskApi, selectOwnState),
		);
		const state = getState();
		switch (state.status) {
			case ResourceStatus.Receiving:
				return state;
			case ResourceStatus.Closed:
			case ResourceStatus.Failed:
			case ResourceStatus.Initial:
				dispatch(resourceAct.triggered(key, nanoid(9)));
			// TODO: do this in reducer task
			// try {
			// 	const output = await runner(inputs);
			// 	task.dispatch(resourceAct.resolved(key, { output }));
			// } catch (error) {
			// 	task.dispatch(resourceAct.rejected(key, { error }));
			// }
			// fallthrough
			case ResourceStatus.Pending: {
				return await condition(Resource.isSettled);
			}
		}
	}
}

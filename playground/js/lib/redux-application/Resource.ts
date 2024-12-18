import { defineActionKind } from "./defineActions";
import { TaskApi, TaskFn, Dict } from "./reduxTypes";
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

type ResultsShape<D, E> = { data: D; error: E };
type ResourceResultsForStatus<R> = {
	[ResourceStatus.Initial]: ResultsShape<undefined, undefined>;
	[ResourceStatus.Pending]: ResultsShape<undefined, undefined>;
	[ResourceStatus.Receiving]: ResultsShape<R, undefined>;
	[ResourceStatus.Failed]: ResultsShape<R | undefined, unknown>;
	[ResourceStatus.Closed]: ResultsShape<R, undefined>;
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

interface ResourceLike<R> extends ResourceMeta {
	taskStatus: TaskStatus;
	status: ResourceStatus;
	data: DataForStatus<this["status"], R>;
	error: ErrorForStatus<this["status"], R>;
}

interface InitialResource<R> extends ResourceLike<R> {
	status: ResourceStatus.Initial;
}
interface PendingResource<R> extends ResourceLike<R> {
	status: ResourceStatus.Pending;
}
interface ClosedResource<R> extends ResourceLike<R> {
	status: ResourceStatus.Closed;
}
interface ReceivingResource<R> extends ResourceLike<R> {
	status: ResourceStatus.Receiving;
}
interface FailedResource<R> extends ResourceLike<R> {
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
	): resource is ReceivingResource<R> | ClosedResource<R> => {
		return (
			resource.status === ResourceStatus.Receiving ||
			resource.status === ResourceStatus.Closed
		);
	};

	export const isSettled = <R>(
		resource: Resource<R>,
	): resource is
		| ReceivingResource<R>
		| FailedResource<R>
		| ClosedResource<R> => {
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

interface ResourceDefinition<TData, TInputs> {
	name: string;
	keyedBy: (attributes: { name: string; inputs: TInputs }) => string;
}

type TGlobalState = {
	cache: Dict<Resource<any>>;
};

const messageAtResource = (key: string, taskId: string) => ({
	payload: {
		key,
		taskId,
	},
});

const dataAtResource = <T>(key: string, data: T) => ({
	payload: {
		...data,
		key: key,
	},
});

const resourceAct = defineActionKind("cache", {
	triggered: messageAtResource,
	resolved: dataAtResource<{ output: unknown }>,
	rejected: dataAtResource<{ error: unknown }>,
	aborted: messageAtResource,
	updated: messageAtResource,
});

function reduceResourceCache<R>() {}

function requireResource<T, R>(
	inputs: T,
	runner: (inputs: T) => Promise<R>,
	context: ResoruceTaskContext<R>,
): TaskFn<TGlobalState> {
	const key = sortStringify(inputs);
	const selectOwnState = (state: TGlobalState): Resource<R> => state.cache[key]!;

	return async function runnerWithCache(taskApi: TaskApi<TGlobalState>) {
		const runnningTaskPromise = context.promisesCache.get(key);
		if (runnningTaskPromise) {
			return runnningTaskPromise;
		} else {
			const promise = runnerTask(taskApi);
			context.promisesCache.set(key, promise);
			return promise.finally(() => {
				context.promisesCache.delete(key);
			});
		}
	};

	async function runnerTask(
		globalTaskApi: TaskApi<TGlobalState>,
	): Promise<Resource<R>> {
		const task = TaskApi.scoped(globalTaskApi, selectOwnState);
		const state = task.getState();
		switch (state.status) {
			case ResourceStatus.Receiving:
				return state;
			case ResourceStatus.Closed:
			case ResourceStatus.Failed:
			case ResourceStatus.Initial:
				{
					const taskId = nanoid(9);
					task.dispatch(resourceAct.triggered(key, taskId));
				}
				try {
					const output = await runner(inputs);
					task.dispatch(resourceAct.resolved(key, { output }));
				} catch (error) {
					task.dispatch(resourceAct.rejected(key, { error }));
				}
			// fallthrough
			case ResourceStatus.Pending: {
				const settledState = await condition(task, Resource.isSettled);
				return settledState;
			}
		}
	}
}

async function condition<T, U extends T>(
	taskApi: TaskApi<T>,
	checker: (state: T) => state is U,
): Promise<U>;
async function condition<T>(
	taskApi: TaskApi<T>,
	checker: (state: T) => boolean,
): Promise<T>;
async function condition<T>(
	taskApi: TaskApi<T>,
	checker: (state: T) => boolean,
): Promise<T> {
	let state = taskApi.getState();
	while (!checker(state)) {
		await taskApi.nextAction();
		state = taskApi.getState();
	}
	return state;
}

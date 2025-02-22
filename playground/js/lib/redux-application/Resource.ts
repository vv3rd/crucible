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

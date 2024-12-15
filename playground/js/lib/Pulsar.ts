import { doNothing } from "./utils";
import type * as React from "react";

/*
















*/

interface EffectHook {
	(effect: React.EffectCallback, deps?: React.DependencyList): void;
}

interface StateHook {
	<S = undefined>(): [
		S | undefined,
		React.Dispatch<React.SetStateAction<S | undefined>>,
	];
	<S>(
		initialState: S | (() => S),
	): [S, React.Dispatch<React.SetStateAction<S>>];
}

interface RefHook {
	<T>(initialValue: T): React.MutableRefObject<T>;
	<T>(initialValue: T | null): React.RefObject<T>;
	<T = undefined>(): React.MutableRefObject<T | undefined>;
}

interface Dispatcher {
	useEffect: EffectHook;
	useState: StateHook;
	useRef: RefHook;
}

const NO_DISPATCHER_WHATEVER = "Aint got a dispatcher";
const NoDispatcher: Dispatcher = {
	useEffect: () => {
		throw new Error(NO_DISPATCHER_WHATEVER);
	},
	useState: () => {
		throw new Error(NO_DISPATCHER_WHATEVER);
	},
	useRef: () => {
		throw new Error(NO_DISPATCHER_WHATEVER);
	},
};

const Internals: {
	dispatcher: Dispatcher;
} = {
	dispatcher: NoDispatcher,
};

const DispatcherFacade = {
	useEffect: (effecct, deps) => Internals.dispatcher.useEffect(effecct, deps),
	useState: (init) => Internals.dispatcher.useState(init),
	useRef: (init) => Internals.dispatcher.useRef(init),
} as Dispatcher;

const Re = DispatcherFacade;

function defineActor<O, T extends string>(
	tagName: T,
	runner: Fn<O, [use: UseActor]>,
) {
	const TAG = Symbol();
	type Tagged<D> = { readonly [TAG]: T } & D;
	type TaggedMsg = Tagged<Msg<any>>;
	type TaggedArr = Tagged<Array<any>>;

	const initialArr: TaggedArr = Object.assign([], { [TAG]: tagName });
	const initialMsg: TaggedMsg = {
		path: -1,
		payload: undefined,
		[TAG]: tagName,
	};

	const reduce = (
		arr = initialArr,
		msg = initialMsg,
		exe: Scheduler = doNothing,
		//
	) => {
		let pointer = 0;
		let changed = new Map<number, any>();
		const use: UseActor = (actor) => {
			const here = pointer++;
			const send = (msg: any): Msg<any> => ({ path: here, payload: msg });

			const old = arr[here];
			const initialRun = msg === initialMsg;
			if (!initialRun && msg.path !== here) {
				return [old, send];
			}
			// will have to resolve injected state here;
			const neu = actor(old, msg.payload, exe);
			if (neu !== old) {
				changed.set(here, neu);
			}
			return [neu, send];
		};

		const out = runner(use);

		if (changed.size > 0) {
			cache.set(arr, out);
			arr = arr.slice() as TaggedArr;
			changed.forEach((val, key) => {
				arr[key] = val;
			});
		}
		return arr;
	};

	const cache = new WeakMap<any[], any>();
	const select = (arr: TaggedArr): O => {
		const cached = cache.get(arr);
		if (!cached) {
			reduce(arr, initialMsg);
			return cache.get(arr)!;
		} else {
			return cached;
		}
	};

	return {
		reduce,
		select,
	};
}

function Sync(executor: Cb<[cleanup: void | Cb]>): Actor<boolean, void> {
	return (executed = false, _, exec) => {
		if (!executed) {
			exec?.(executor);
		}
		return true;
	};
}

function Ref<T>(current: T) {
	return (_1: { current: T }, _2: never) => ({ current });
}

function State<T extends Defined>(initial: T | Lazy<T>) {
	return (state: T, next?: SetStateUpdate<T>) => {
		if (state === undefined) {
			if (initial instanceof Function) {
				state = initial();
			} else {
				state = initial;
			}
		}
		if (next === undefined) {
			return state;
		}
		if (next instanceof Function) {
			return next(state);
		} else {
			return next;
		}
	};
}

type SetStateUpdate<T> = T | ((previous: T) => T);
type Defined = NonNullable<unknown> | null;

interface UseActor {
	<S, M>(actor: Actor<S, M>): [S, (msg: M) => Msg<M>];
}

/*







*/

interface Fn<R = void, A extends any[] = []> {
	(...args: A): R;
}
interface Cb<A extends any[] = []> extends Fn<void, A> {}
interface Lazy<T> extends Fn<T> {}
interface Task<R = void, A extends any[] = []> extends Fn<Promise<R>, A> {}

type ActorPath = string | number;

interface Msg<D = void> {
	readonly path: ActorPath;
	readonly payload: D;
}

interface Actor<T, M, I = T> {
	(state: NoInfer<T> | I, message?: M, scheduler?: Scheduler): T;
}

interface Scheduler {
	(callback: Fn<void | Cb, []>): void;
}

interface Disposable {
	dispose: Cb;
}

interface Observable<T> {
	observe: Fn<Disposable, [observer: Cb<[T]>]>;
}

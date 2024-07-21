/*
















*/

interface UseActor<F extends Fn = Fn> {
	<S, M extends Msg<any, any>>(actor: Actor<S, M, F>): [S, (msg: M) => void];
}

let actorsCount = 0;
function createActor(runner: Fn<void, [use: UseActor]>) {
	const key = `actor-${++actorsCount}`;

	type State = Array<any>;

	return (select: AnyFn, dispatch: AnyFn) => {
		return (state?: State, action?: Msg) => {
			if (state === undefined) {
				const state = [];
				const use: UseActor = (actor) => {
					const v = actor();
					state.push(v);
					return [v, (msg) => {}];
				};
				runner(use);
			}
		};
	};
}

createActor((use) => {
	const [num, send] = use(State(1));
});

type StateUpdate<S> = S | ((current: S) => S);

const State =
	<S>(initialState: S) =>
	(state: S = initialState, msg: Msg<"set", StateUpdate<S>>) => {
		if (msg.path == "set" && "payload" in msg) {
			const update = msg.payload;
			if (update instanceof Function) {
				return update(state);
			} else {
				return update;
			}
		}
		return state;
	};

interface Fn<R = void, A extends any[] = []> {
	(...args: A): R;
}
interface AnyFn extends Fn<any, any> {}
interface Callback<A = void> extends Fn<void, [input: A]> {}
interface Lazy<T> extends Fn<T> {}
interface Task<R = void, A extends any[] = []> extends Fn<Promise<R>, A> {}

declare const Tag: unique symbol;

interface BaseMsg<P extends string = string> {
	path: P;
}

interface PayloadMsg<P extends string = string, D = void> extends BaseMsg<P> {
	payload: D;
}

type Msg<P extends string = string, D = void> = void extends D ? BaseMsg<P> : PayloadMsg<P, D>;

type PickMessage<M extends Msg, K extends M["path"]> = Extract<M, BaseMsg<K>>;
type InferPayload<M extends Msg> = M extends PayloadMsg<string, infer D> ? D : void;
type InferMethods<M extends Msg> = {
	[K in M["path"]]: (payload: InferPayload<PickMessage<M, K>>) => PickMessage<M, K>;
};

type InferMsg<A extends Actor<any, any, any>> = A extends Actor<any, infer T, any> ? T : never;

type InferState<A extends Actor<any, any, any>> = A extends Actor<infer T, any, any> ? T : never;

interface Actor<T, M extends Msg = Msg, F extends Fn = Fn> {
	(state?: T, message?: M, scheduler?: Scheduler<F>): T;
}

interface Scheduler<T> {
	(callback: T): void;
}

interface Disposable {
	dispose: Callback;
}

interface Observable<T> {
	observe: Fn<Disposable, [observer: Callback<T>]>;
}

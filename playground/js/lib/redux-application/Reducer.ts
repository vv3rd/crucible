import {
	AnyMessagePartMaker,
	AnyMessageMaker,
	Message,
	SomeMessage,
	Matchable,
	InferMatch,
	MadeMessage,
	CompleteMessageMaker,
	StateRoot,
	Discoverable,
	Selectable,
} from "./types";
import { TaskScheduler } from "./Task";
import { ReducerWithoutAction } from "react";
import { createMatcher } from "./Message";

export interface Reducer<TState, TMsg extends Message> {
	(
		state: TState | undefined,
		message: TMsg,
		schedule: TaskScheduler<TState, TMsg>,
	): TState;
}

export namespace Reducer {
	const InitAction = { type: "INIT-" + Math.random() };
	const ProbeAction = { type: "PROBE-" + Math.random() };

	type StateOf<R extends Reducer<any, any>> = R extends Reducer<infer S, any>
		? S
		: never;
	type MessageOf<R extends Reducer<any, any>> = R extends Reducer<any, infer M>
		? M
		: never;

	export function initialize<TState>(reducer: Reducer<TState, any>) {
		return reducer(undefined, InitAction, () => {});
	}

	export function makeDiscoverable<R extends Reducer<any, any>>(
		reducer: R,
	): R & Selectable<StateOf<R>> {
		type TState = StateOf<R>;
		type TMsg = MessageOf<R>;
		let discoveredSelector: (root: StateRoot) => TState = () => {
			throw new Error(ERR_SELECT_BEFORE_DISCOVER);
		};
		const select: typeof discoveredSelector = (root) =>
			discoveredSelector(root);

		const discoverableReducer: Reducer<TState, TMsg> = (val, msg, exe) => {
			if (msg === ProbeAction && val !== undefined) {
				exe(({ getState }) => {
					discoveredSelector = getState;
				});
				return val;
			}

			return reducer(val, msg, exe);
		};

		return Object.assign(discoverableReducer, { select }, reducer);
	}
}

interface DefinitionResult<TState, B extends Build> {
	reducer: Reducer<TState, B["action"]> & {
		getInitialState: () => TState;
	};

	actions: {
		[K in keyof B["makers"]]: CompleteMessageMaker<K, B["makers"][K]>;
	};
}

type CaseReducer<TState, TMsg extends Message> = (
	state: TState,
	action: TMsg,
	schedule: TaskScheduler<TState, TMsg>,
) => TState | void;

type AnyCaseReducer = CaseReducer<any, any>;

interface AddCase<TState, B extends Build> extends DefinitionResult<TState, B> {
	<TType extends string, TMaker extends AnyMessagePartMaker>(
		actionType: TType,
		actionPartMaker: TMaker,
	): AddCaseReducer<
		TState,
		MadeMessage<TType, TMaker>,
		Build<B["action"], B["makers"] & { [key in TType]: TMaker }>
	>;

	<N extends string>(
		actionType: N,
	): AddCaseReducer<
		TState,
		Message<N>,
		Build<B["action"], B["makers"] & { [key in N]: () => void }>
	>;

	<Ms extends readonly Matchable<any>[]>(
		...matchers: Ms
	): AddCaseReducer<TState, InferMatch<Ms[number]>, B>;
}

interface AddCaseReducer<TState, TMsg extends Message, B extends Build> {
	(
		reducer: CaseReducer<TState, TMsg>,
	): AddCase<TState, Build<B["action"] | TMsg, B["makers"]>>;
}

interface Build<
	M extends Message = Message,
	C = Record<string, AnyMessagePartMaker>,
> {
	action: M;
	makers: C;
}

interface Case {
	matchers: Matchable<any>[];
	reduce: AnyCaseReducer;
}

export function buildReducer<T>(getInitialState: () => T) {
	function createReducer(cases: Case[]) {
		function finalReducer(
			state: T | undefined = getInitialState(),
			action: Message,
			schedule: TaskScheduler<T, Message>,
		) {
			for (const c of cases) {
				for (const d of c.matchers) {
					if (d.match(action)) {
						const next = c.reduce(state, action, schedule);
						if (next) {
							return next;
						}
					}
				}
			}
			return state;
		}
		finalReducer.getInitialState = getInitialState;
		return finalReducer;
	}

	function createAddReducer(
		matchers: Matchable<any>[],
		cases: Case[],
		actions: Record<string, AnyMessageMaker>,
	) {
		//
		function addReducer(reduce: AnyCaseReducer) {
			const newCase = { matchers, reduce };
			return createAddCase([...cases, newCase], actions);
		}

		return addReducer;
	}

	function createAddCase(
		cases: Case[],
		actions: Record<string, AnyMessageMaker>,
	) {
		//
		function addCase(
			firstArg: string | AnyMessageMaker,
			secondArg: AnyMessageMaker,
			...restArgs: AnyMessageMaker[]
		) {
			if (typeof firstArg === "string") {
				let newMaker: AnyMessageMaker;
				if (secondArg) {
					// @ts-ignore
					newMaker = (...args: any[]) => ({
						type: firstArg,
						payload: secondArg(...args),
					});
				} else {
					// @ts-ignore
					newMaker = () => ({
						type: firstArg,
					});
				}
				newMaker.type = firstArg;
				newMaker.match = createMatcher(firstArg);

				return createAddReducer([newMaker], cases, {
					...actions,
					[firstArg]: newMaker,
				});
			} else {
				const matchers = [firstArg];
				if (secondArg) matchers.push(secondArg);
				if (restArgs.length) matchers.push(...restArgs);
				return createAddReducer(matchers, cases, actions);
			}
		}

		Object.defineProperties(addCase, {
			reducer: {
				get: () => createReducer(cases),
			},
			actions: {
				get: () => actions,
			},
		});

		return addCase;
	}

	const addCase = createAddCase([], {});

	return addCase as AddCase<T, Build<SomeMessage, {}>>;
}

const ERR_SELECT_BEFORE_DISCOVER =
	"Cannot select discoverable state before probe routine completes.";

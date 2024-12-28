import {
	Reducer,
	TaskScheduler,
	AnyMessagePartMaker,
	AnyMessageMaker,
	Message,
	SomeMessage,
	Matchable,
	InferMatch,
	MadeMessage,
	CompleteMessageMaker,
} from "./types";

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

export function createMatcher(type: string) {
	return (ac: Message): ac is Message => ac.type === type;
}

import {
	Reducer,
	SetTask,
	AnyActionPartMaker,
	AnyActionMaker,
	Action,
	SomeAction,
	Matchable,
	InferMatch,
	MadeAction,
	CompleteActionMaker,
} from "./reduxTypes";

interface DefinitionResult<TState, B extends Build> {
	reducer: Reducer<TState, B["action"]> & {
		getInitialState: () => TState;
	};

	actions: {
		[K in keyof B["makers"]]: CompleteActionMaker<K, B["makers"][K]>;
	};
}

type CaseReducer<TState, TAction> = (
	state: TState,
	action: TAction,
	schedule: SetTask<TState>,
) => TState | void;

type AnyCaseReducer = CaseReducer<any, any>;

interface AddCase<TState, B extends Build> extends DefinitionResult<TState, B> {
	<TType extends string, TMaker extends AnyActionPartMaker>(
		actionType: TType,
		actionPartMaker: TMaker,
	): AddCaseReducer<
		TState,
		MadeAction<TType, TMaker>,
		Build<B["action"], B["makers"] & { [key in TType]: TMaker }>
	>;

	<N extends string>(
		actionType: N,
	): AddCaseReducer<
		TState,
		Action<N>,
		Build<B["action"], B["makers"] & { [key in N]: () => void }>
	>;

	<Ms extends readonly Matchable<any>[]>(
		...matchers: Ms
	): AddCaseReducer<TState, InferMatch<Ms[number]>, B>;
}

interface AddCaseReducer<TState, TAction, B extends Build> {
	(
		reducer: CaseReducer<TState, TAction>,
	): AddCase<TState, Build<B["action"] | TAction, B["makers"]>>;
}

interface Build<A = unknown, C = Record<string, AnyActionPartMaker>> {
	action: A;
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
			action: Action,
			schedule: SetTask<T>,
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
		actions: Record<string, AnyActionMaker>,
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
		actions: Record<string, AnyActionMaker>,
	) {
		//
		function addCase(
			firstArg: string | AnyActionMaker,
			secondArg: AnyActionMaker,
			...restArgs: AnyActionMaker[]
		) {
			if (typeof firstArg === "string") {
				let newMaker: AnyActionMaker;
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

	return addCase as AddCase<T, Build<SomeAction, {}>>;
}

export function createMatcher(type: string) {
	return (ac: Action): ac is Action => ac.type === type;
}

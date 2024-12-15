import {
	Action,
	AnyActionMaker,
	AnyActionPartMaker,
	CompleteActionMaker,
	WithPrefix,
} from "./reduxTypes";

const { assign, entries, fromEntries } = Object;

export const noPayload = () => {};
export const withPayload = <T>(payload: T) => ({ payload });

export function defineAction<TType extends string>(type: TType) {
	return <TMaker extends (...args: any[]) => Action>(
		makeActionMaker: (
			make: <const P>(payload: P) => { type: TType; payload: P },
		) => TMaker,
	) => {
		const actionMaker = makeActionMaker((payload) => ({
			payload,
			type,
		}));
		const matcher = (action: Action): action is ReturnType<TMaker> =>
			action.type === type;
		return assign(actionMaker, {
			type,
			match: matcher,
		});
	};
}

export function defineActionKind<
	TPrefix extends string,
	TMakers extends { [key: string]: AnyActionPartMaker; match?: never },
>(prefix: TPrefix, actionPartMakers: TMakers) {
	type ActionKindMakers = {
		[K in keyof TMakers]: CompleteActionMaker<
			WithPrefix<TPrefix, K>,
			TMakers[K]
		>;
	};
	type ActionKind = ReturnType<ActionKindMakers[keyof ActionKindMakers]>;

	const KIND = Symbol();

	const actionMakers = fromEntries(
		entries(actionPartMakers).map(([name, prepare]) => {
			const match = (action: Action): action is AnyActionMaker => {
				return matchKind(action) && action.type === type;
			};
			const type = `${prefix}/${name}`;
			const actionMaker: AnyActionMaker = assign(
				(...args: any[]) => ({
					...prepare(...args),
					type: type,
					kind: KIND,
				}),
				{ type, match },
			);
			return [name, actionMaker];
		}),
	) satisfies {
		[key: string]: AnyActionMaker;
	} as ActionKindMakers;

	const matchKind = (action: Action): action is ActionKind => {
		return "kind" in action && action.kind === KIND;
	};

	return { ...actionMakers, match: matchKind };
}

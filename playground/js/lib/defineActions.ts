import {
	Action,
	AnyActionMaker,
	AnyActionPartMaker,
	CompleteActionMaker,
	WithPrefix,
} from "./reduxTypes";

const { assign, entries, fromEntries } = Object;

export const withPayload = <T>(payload: T) => ({ payload });

function defineAction<TType extends string>(type: TType) {
	return <TMaker extends (...args: any[]) => Action>(
		makeActionMaker: (
			make: <const P>(payload: P) => { type: TType; payload: P },
		) => TMaker,
	) => {
		return assign(
			makeActionMaker((payload) => ({
				payload,
				type,
			})),
			{
				type,
				match: (action: Action): action is ReturnType<TMaker> =>
					action.type === type,
			},
		);
	};
}

function defineActionKind<
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

const appActionKind = defineActionKind("thingy", {
	kek: withPayload<void>,
	lol: withPayload<{ foo: "bar" }>,
});

appActionKind.kek().type === "thingy/kek";
appActionKind.lol({ foo: "bar" }).payload.foo;

type Fields = {
	username: string;
	inviteCode: number;
	consents: number[];
};

type ChangePayload = {
	[K in keyof Fields]: [name: K, value: Fields[K]];
}[keyof Fields];

const genAction = defineAction("make-stuff")((pack) => {
	return <F extends keyof Fields>(name: F, value: Fields[F]) =>
		pack([name, value] as ChangePayload);
});

const nonGenAction = defineAction("make-stuff")(
	(pack) => (name: string, thing: number) =>
		pack({
			name,
			thing,
		}),
);

const testAc = { type: "kek" };

if (genAction.match(testAc)) {
	testAc;
}

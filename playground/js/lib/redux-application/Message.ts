import {
	Message,
	AnyMessageMaker,
	AnyMessagePartMaker,
	CompleteMessageMaker,
	WithPrefix,
} from "./types";

const { assign, entries, fromEntries } = Object;

export const noPayload = () => {};
export const withPayload = <T>(payload: T) => ({ payload });

export function defineMessage<TType extends string>(type: TType) {
	return <TMaker extends (...args: any[]) => Message>(
		makeMessageMaker: (
			make: <const P>(payload: P) => { type: TType; payload: P },
		) => TMaker,
	) => {
		const actionMaker = makeMessageMaker((payload) => ({
			payload,
			type,
		}));
		const matcher = (action: Message): action is ReturnType<TMaker> =>
			action.type === type;
		return assign(actionMaker, {
			type,
			match: matcher,
		});
	};
}

export function defineMessageKind<
	TPrefix extends string,
	TMakers extends { [key: string]: AnyMessagePartMaker; match?: never },
>(prefix: TPrefix, actionPartMakers: TMakers) {
	type MessageKindMakers = {
		[K in keyof TMakers]: CompleteMessageMaker<
			WithPrefix<TPrefix, K>,
			TMakers[K]
		>;
	};
	type MessageKind = ReturnType<MessageKindMakers[keyof MessageKindMakers]>;

	const KIND = Symbol();

	const actionMakers = fromEntries(
		entries(actionPartMakers).map(([name, prepare]) => {
			const match = (action: Message): action is AnyMessageMaker => {
				return matchKind(action) && action.type === type;
			};
			const type = `${prefix}/${name}`;
			const actionMaker: AnyMessageMaker = assign(
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
		[key: string]: AnyMessageMaker;
	} as MessageKindMakers;

	const matchKind = (action: Message): action is MessageKind => {
		return "kind" in action && action.kind === KIND;
	};

	return { ...actionMakers, match: matchKind };
}

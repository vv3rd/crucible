import {
	Message,
	AnyMessageMaker,
	AnyMessagePartMaker,
	CompleteMessageMaker,
	WithPrefix,
	MessageWith,
} from "./types";

const Object = { ...globalThis.Object };
const { assign, entries, fromEntries } = Object;

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

	const result = { ...actionMakers, match: matchKind };
	return result as typeof result & { T: MessageKind };
}

export function createMatcher<M extends Message = Message>(type: string) {
	return (ac: Message): ac is M => ac.type === type;
}

export function Msg<T extends string, P>(
	type: T,
	payload: P,
): MessageWith<P, T>;
export function Msg<T extends string>(type: T): Message<T>;
export function Msg<T extends string, P>(type: T, payload?: P) {
	if (!payload) return { type };
	else return { type, payload };
}

export namespace Msg {
	export function create<
		T extends string,
		M extends (this: Message<T>, ...args: any[]) => Message<T>,
	>(type: T, createMsg: M) {
		createMsg = Object.assign(createMsg.bind({ type }), createMsg);
		const attributes = {
			match: createMatcher<ReturnType<typeof createMsg>>(type),
			type,
		};
		return Object.assign(createMsg, attributes);
	}

	// TODO: allow creating a group of messages

	export function ofType<T extends string>(type: T) {
		return Object.assign(
			create(type, () => Msg(type)),
			{
				withPayload: <P>() => create(type, (payload: P) => Msg(type, payload)),
				// TODO: figure out how msgs can have traits
			},
		);
	}
}

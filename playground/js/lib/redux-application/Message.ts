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
	TMakers extends { [key: string]: AnyMessagePartMaker },
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
	export function create<T extends string, M extends Factory<any[], T>>(
		type: T,
		createMsg: M,
	): Writer<T, M> {
		return Object.assign(createMsg.bind({ type }), createMsg, {
			match: createMatcher<ReturnType<typeof createMsg>>(type),
			type,
		});
	}

	export type AnyFactory = Factory<any[], Message.Type>;
	export type Factory<
		I extends any[],
		T extends Message.Type,
		M extends Message<T> = Message<T>,
	> = (this: { type: T }, ...inputs: I) => M;

	export type AnyWriter = Writer<Message.Type, AnyFactory>;
	export type Writer<
		T extends Message.Type,
		F extends Factory<any[], T>,
	> = Matcher<ReturnType<F>> & { type: T } & F;

	export type Matcher<M extends Message> = {
		match: (message: Message) => message is M;
	};

	export function ofType<T extends string>(type: T) {
		const builders = {
			withPayload: <P>() => create(type, (payload: P) => Msg(type, payload)),
			withPayloadFrom: <A extends unknown[], P>(prepare: (...args: A) => P) =>
				create(type, (...a: A) => Msg(type, prepare(...a))),
		};
		return Object.assign(
			create(type, () => Msg(type)),
			builders,
		);
	}
}

// TODO: allow creating a group of messages
export namespace MsgFamily {
	type BuildUtils = {};
	export function create<
		S extends string,
		A extends { [key: string]: Msg.AnyWriter },
	>(familyName: S, builder: (buildUtils: BuildUtils) => A) {}
}

const resultMsg = Msg.create("kek/lol", () => {
	return {
		type: "kek/lol",
	};
});

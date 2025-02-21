import { identity } from "../toolkit";
import {
	Message,
	AnyMessageMaker,
	AnyMessagePartMaker,
	CompleteMessageMaker,
	WithPrefix,
	MessageWith,
    Pretty,
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
			withPayload: <P, A extends unknown[] = [payload: P]>(prepare?: (...args: A) => P) => 
				create(type, (...a: A) => Msg(type, prepare ? prepare(...a) : a[0] as P))
		};
		return Object.assign(
			create(type, () => Msg(type)),
			builders,
		);
	}
}

export namespace MsgGroup {
	export function create<
		S extends string,
		A extends readonly KeyVal[],
	>(familyName: S, buildFunc: (b: ReturnType<typeof _builder<S>>) => A) {
		const messages = buildFunc(_builder(familyName))
		const result = Object.fromEntries(messages.map(entry => [entry["~key"], entry["~value"]]))
		return result as KeyValsObj<A[number]>
		
	}

	const _builder = <S extends string>(prefix: S) => <T extends string>(type: T) => {
        const fullType = `${prefix}/${type}` as const;
		return {
			"~key": type,
			"~value": Msg.create(fullType, () => Msg(fullType)),
			withPayload: <P, A extends any[] = [payload: P]>(prepare?: (...a: A) => P) => ({
				"~key": type,
				"~value": Msg.create(fullType, (...a: A) => Msg(fullType, prepare ? prepare(...a) : a[0] as P ))
			}),
		}
	}

	interface KeyVal<V = any> {
	    "~key": string;
	    "~value": V;
	}

	type KeyValsObj<T extends KeyVal> = Pretty<{
	  [K in T["~key"]]: Extract<T, { "~key": K }>["~value"]
	}>;
}

const resultMsg = Msg.ofType("kek/lol").withPayload((a: number, b: number) => a + b)

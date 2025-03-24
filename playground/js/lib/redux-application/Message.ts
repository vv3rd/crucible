import { identity } from "../toolkit";
import { Fn } from "./Fn";
import { Pretty } from "./types";

export interface Msg<T extends Msg.Type = Msg.Type> {
	type: T;
	// [key: string]: unknown;
}

export interface MsgWith<P, T extends Msg.Type = Msg.Type> extends Msg<T> {
	payload: P;
}

export type AnyMsg = Msg<any>;

export function Msg<T extends Msg.Type, P>(type: T, payload: P): MsgWith<P, T>;
export function Msg<T extends Msg.Type>(type: T): Msg<T>;
export function Msg<T extends Msg.Type, P>(type: T, payload?: P) {
	if (!payload) return { type };
	else return { type, payload };
}

export namespace Msg {
	export type Type = string & { readonly MsgType?: unique symbol };

	export function create<T extends string, M extends FactoryFn<any[], T>>(type: T, createMsg: M) {
		type R = TypedFactory<M>;
		return Object.assign(createMsg.bind({ type }), createMsg, {
			match: matchByType<ReturnType<typeof createMsg>>(type),
			type,
		}) as R;
	}

	export function matchByType<M extends Msg = Msg>(type: string) {
		return (ac: Msg): ac is M => ac.type === type;
	}

	export type AnyFactoryFn = FactoryFn<any[], Msg.Type>;
	export type FactoryFn<I extends any[], T extends Msg.Type, M extends Msg<T> = Msg<T>> = (
		this: { type: T },
		...inputs: I
	) => M;

	export type AnyTypedFactory = TypedFactory<AnyFactoryFn>;
	export type TypedFactory<F extends FactoryFn<any[], any>> = Matcher<ReturnType<F>> & {
		type: ReturnType<F>["type"];
		T: ReturnType<F>;
	} & F;

	export type SimpleFactory<T extends Msg.Type, P = void> = Matcher<{ type: T; payload: P }> & {
		(payload: P): { type: T; payload: P };
		type: T;
	};

	export type Matcher<M extends Msg> = {
		match: (message: Msg) => message is M;
	};

	export function ofType<T extends string>(type: T) {
		const builders = {
			withPayload: <P, A extends unknown[] = [payload: P]>(prepare: Fn<A, P> = identity as any) =>
				create(type, (...a: A) => Msg(type, prepare(...a))),
		};
		return Object.assign(
			create(type, () => Msg(type)),
			builders,
		);
	}

	export const empty = () => ({ type: "" });
}

export namespace MsgGroup {
	export function create<S extends string, A extends readonly KeyVal[]>(
		familyName: S,
		buildFunc: (b: ReturnType<typeof _builder<S>>) => A,
	) {
		const messages = buildFunc(_builder(familyName));
		const result = Object.fromEntries(messages.map((entry) => [entry[0], entry[1]]));
		return result as KeyValsObj<A[number]>;
	}

	const _builder =
		<S extends string>(prefix: S) =>
		<T extends string>(type: T) => {
			const fullType = `${prefix}/${type}` as const;
			return {
				0: type,
				1: Msg.create(fullType, () => Msg(fullType)),
				withPayload: <P, A extends any[] = [payload: P]>(prepare: Fn<A, P> = identity as any) => ({
					0: type,
					1: Msg.create(fullType, (...a: A) => Msg(fullType, prepare(...a))),
				}),
			};
		};

	interface KeyVal<V = any> {
		0: string;
		1: V;
	}

	type KeyValsObj<T extends KeyVal> = Pretty<{
		[K in T[0]]: Extract<T, { 0: K }>[1];
	}>;
}

export function defineMsgNsFromBuilders<Builders extends Record<string, any>>(
	builders: Builders,
) {
	return function defineMsgNs<
		TPrefix extends string,
		TFactories extends MsgFactoriesDict,
	>(prefix: TPrefix, factories: (utils: Builders) => TFactories) {
		const brand = Symbol();
		type Ns = MsgNs<TPrefix, TFactories>;
		type Msg = ReturnType<Ns[keyof Ns]>;

		const msgNs = Object.fromEntries(
			Object.entries(factories(builders)).map(([name, prepare]) => {
				const type = `${prefix}/${name}`;
				const match = (msg: { type: string }) => {
					return "brand" in msg && msg.brand == brand && msg.type === type;
				};
				const msgMaker = Object.assign(
					(...args: any[]) => ({
						...prepare(...args),
						type: type,
						brand: brand,
					}),
					{ type, match },
				);
				return [name, msgMaker];
			}),
		) as Ns;

		const isFromThisNs = (msg: { type: string }): msg is Msg => {
			return "brand" in msg && msg.brand === brand;
		};

		return [msgNs, isFromThisNs] as const;
	};
}

type PackageMsg = (...args: any[]) => { payload?: any };

type MsgFactoriesDict = Record<string, PackageMsg>;

type MsgPType<P extends string, A> = `${P}/${Extract<A, string>}`;

type NamespacedMsg<
	P extends string,
	K extends keyof T,
	T extends MsgFactoriesDict,
> = {
	type: MsgPType<P, K>;
	brand: symbol;
} & ReturnType<T[K]>;

type MsgNs<P extends string, T extends MsgFactoriesDict> = {
	[K in keyof T]: {
		(...args: Parameters<T[K]>): NamespacedMsg<P, K, T>;
		type: MsgPType<P, K>;
		match: (msg: { type: string }) => msg is NamespacedMsg<P, K, T>;
	};
};

export const defineMsgNs = defineMsgNsFromBuilders({
	carries: <T>(payload: T) => ({ payload }),
	empty: () => ({}),
});

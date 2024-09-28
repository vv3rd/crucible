const { assign, entries, fromEntries } = Object;

export function defineActionsFromBuilders<Builders extends Record<string, any>>(
	builders: Builders,
) {
	return function defineActions<
		TPrefix extends string,
		TFactories extends PayloadDefs,
	>(prefix: TPrefix, factories: (utils: Builders) => TFactories) {
		const brand = Symbol();
		type Namepace = ActionDefRecord<TPrefix, TFactories>;
		type Actions = ReturnType<Namepace[keyof Namepace]>;

		const actions = fromEntries(
			entries(factories(builders)).map(([name, prepare]) => {
				const type = `${prefix}/${name}`;
				const match = (msg: { type: string }) => {
					return "brand" in msg && msg.brand == brand && msg.type === type;
				};
				const msgMaker = assign(
					(...args: any[]) => ({
						...prepare(...args),
						type: type,
						brand: brand,
					}),
					{ type, match },
				);
				return [name, msgMaker];
			}),
		) as Namepace;

		const isFromThisNamepace = (msg: { type: string }): msg is Actions => {
			return "brand" in msg && msg.brand === brand;
		};

		return [actions, isFromThisNamepace] as const;
	};
}

type PayloadDef = (...args: any[]) => { payload?: any };
type PayloadDefs = Record<string, PayloadDef>;

type WithPrefix<P extends string, A> = `${P}/${Extract<A, string>}`;

type NamespacedAction<
	P extends string,
	K extends keyof T,
	T extends PayloadDefs,
> = {
	type: WithPrefix<P, K>;
	brand: symbol;
} & ReturnType<T[K]>;

type NamespacedActionCreator<
	P extends string,
	K extends keyof T,
	T extends PayloadDefs,
> = {
	(...args: Parameters<T[K]>): NamespacedAction<P, K, T>;
	type: WithPrefix<P, K>;
	match: (msg: {
		type: string;
	}) => msg is NamespacedAction<P, K, T>;
};

type ActionDefRecord<P extends string, T extends PayloadDefs> = {
	[K in keyof T]: NamespacedActionCreator<P, K, T>;
};

export const defineActions = defineActionsFromBuilders({
	payload: <T>(payload: T) => ({ payload }),
	message: () => ({}),
	routine: () => ({}),
});

const [acts] = defineActions("thingy", (util) => ({
	kek: util.message,
	lol: util.payload<{ foo: "bar" }>,
}));

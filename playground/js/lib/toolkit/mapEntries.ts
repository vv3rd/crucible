type Entry<T> = {
	[K in keyof T]: [key: K, value: T[K]];
}[keyof T];

type Intersection<T> = (T extends any ? (t: T) => any : never) extends (i: infer I) => any
	? I
	: never;

type FromEntries<T extends [string, any]> = Intersection<
	T extends [infer Key extends string, infer Val]
		? {
				[K in Key]: Val;
			}
		: never
>;

const { fromEntries, entries } = Object;

function mapEntries<T extends object, const E extends [string, any]>(
	object: T,
	mapper: (...[key, value]: Entry<T>) => E,
) {
	return fromEntries(
		entries(object).map(([key, value]) => mapper(key as any, value)),
	) as FromEntries<E>;
}

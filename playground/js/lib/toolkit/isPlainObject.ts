const { prototype, getPrototypeOf } = Object;

export function isPlainObject(
	thing: any,
): thing is { [key: PropertyKey]: unknown } {
	return getPrototypeOf(thing) === prototype || getPrototypeOf(thing) === null;
}

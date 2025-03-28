const { prototype, getPrototypeOf } = Object;

export function isPlainObject(thing: any): thing is { [key: PropertyKey]: unknown } {
    if (!thing) return false;
    return getPrototypeOf(thing) === prototype || getPrototypeOf(thing) === null;
}

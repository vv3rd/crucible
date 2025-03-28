export function match<const T extends object>(
    thing: unknown,
    schema: T,
): thing is typeof thing & T {
    if (typeof thing !== "object" || !thing) {
        return false;
    }
    for (const [key, value] of Object.entries(schema)) {
        if ((thing as any)[key] !== value) {
            return false;
        }
    }
    return true;
}

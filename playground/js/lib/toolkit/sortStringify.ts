import { isPlainObject } from "./isPlainObject";

const { fromEntries, keys } = Object;

export function sortStringify(any: any): string {
    return JSON.stringify(any, (_, val) => {
        if (isPlainObject(val)) {
            return fromEntries(
                keys(val)
                    .sort()
                    .map((key) => [key, val[key]]),
            );
        } else {
            return val;
        }
    });
}

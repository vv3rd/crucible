export function doNothing() { }
export function runOnce<T extends (...a: any[]) => any>(func: T) {
    type A = Parameters<T>;
    type R = ReturnType<T>;
    let result: R;
    let runner = (...args: A): R => {
        result = func(...args);
        runner = () => result;
        return result;
    };
    return Object.assign((...args: A) => runner(...args), func) as T;
}

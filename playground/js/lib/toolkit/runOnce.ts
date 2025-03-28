export function runOnce<T extends (...a: any[]) => any>(func: T): T {
    type A = Parameters<T>;
    type R = ReturnType<T>;
    let runner = (...args: A): R => {
        try {
            const result = func(...args);
            runner = () => {
                return result;
            };
            return result;
        } catch (error) {
            runner = () => {
                throw error;
            };
            throw error;
        }
    };
    const wrapper = (...args: A) => runner(...args);
    return Object.assign(wrapper, func);
}

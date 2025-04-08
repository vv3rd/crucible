export function tryCatch<R, E = never>(
    func: () => R,
    blocks: { finally?: () => void; catch?: (err: unknown) => E },
): R | E {
    try {
        let result: any = func();
        if (result instanceof Promise) {
            if (blocks.catch) {
                result = result.catch(blocks.catch);
            }
            if (blocks.finally) {
                result = result.finally(blocks.finally);
            }
        }
        return result;
    } catch (err) {
        if (blocks.catch) {
            return blocks.catch(err);
        } else {
            throw err;
        }
    } finally {
        if (blocks.finally) {
            blocks.finally();
        }
    }
}

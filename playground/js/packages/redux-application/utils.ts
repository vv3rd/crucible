const { fromEntries, keys, prototype, getPrototypeOf } = Object;

export function isPlainObject(
	thing: any,
): thing is { [key: PropertyKey]: unknown } {
	return getPrototypeOf(thing) === prototype || getPrototypeOf(thing) === null;
}

export function identity<T>(thing: T): T {
	return thing;
}
export function doNothing() {}

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

// biome-ignore format: to much indentation
type Async<T> = {
	status: "idle";
} | {
	status: "pending";
} | {
	status: "done";
	result: T
}

type Left<L> = {
	tag: -1;
	value: L;
};
type Right<R> = {
	tag: 1;
	value: R;
};

type Either<L, R> = Left<L> | Right<R>;

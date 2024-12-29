type AreArgsEqual = <Args extends any[]>(args1: Args, args2: Args) => boolean;

const strictEqual = (a: any, b: any) => a === b;

export const areArraysEqual: AreArgsEqual = (
	args1,
	args2,
	isEqual = strictEqual,
) => {
	if (isEqual(args1.length, args2.length)) {
		return false;
	}

	for (let i = 0; i < args1.length; i++) {
		if (args1[i] !== args2[i]) {
			return false;
		}
	}

	return true;
};

function createMemoLast(defaultEqual: AreArgsEqual) {
	return function memoLast<Fn extends (this: any, ...args: any[]) => any>(
		fn: Fn,
		isEqual: (a: Parameters<Fn>, b: Parameters<Fn>) => boolean = defaultEqual,
	) {
		if (typeof fn !== "function") {
			throw new Error("fn should be a function");
		}

		if (isEqual !== undefined && typeof isEqual !== "function") {
			throw new Error("isEqual should be a function");
		}

		let lastThis: ThisParameterType<Fn>;
		let lastArgs: Parameters<Fn>;
		let lastResult: ReturnType<Fn>;

		function memoizedFunction(
			this: ThisParameterType<Fn>,
			...args: Parameters<Fn>
		): ReturnType<Fn> {
			if (!lastArgs || this !== lastThis || !isEqual(lastArgs, args)) {
				// eslint-disable-next-line @typescript-eslint/no-this-alias
				lastThis = this;
				lastArgs = args;
				lastResult = fn.apply(this, args);
			}

			return lastResult;
		}

		memoizedFunction.getLastResult = () => lastResult;
		memoizedFunction.getLastThis = () => lastThis;
		memoizedFunction.getLastArgs = () => lastArgs;

		return Object.assign(memoizedFunction, fn);
	};
}

export const memoLast = createMemoLast(areArraysEqual);

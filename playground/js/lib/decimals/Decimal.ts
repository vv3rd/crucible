type MaxOperations = 10;

type CalcBase<TResult, TObject, TOperator> = {
	(...args: [left: TObject, operator: TOperator, right: TObject]): TResult;
	(equation: Array<TObject | TOperator>): TResult;
};

// biome-ignore format:
type CalcOverloads<
	TResult,
	TObject,
	TOperator,
	TOverloads extends (...equation: any[]) => any = CalcBase<TResult, TObject, TOperator>,
	I extends ReadonlyArray<number> = [],
> = I["length"] extends MaxOperations
	? TOverloads
	: CalcOverloads<TResult, TObject, TOperator, TOverloads & {
		(...args: [ ...Parameters<TOverloads>, operator: TOperator, value: TObject]): TResult;
	}, [...I, 1]>;

type Val = Decimal | number;
type Op = Operator | OperatorKey;
type DecimalCalc = CalcOverloads<Decimal, Val, Op>;

export const calc: DecimalCalc = (...equation) => {
	if (equation.length === 1 && equation[0] instanceof Array) {
		equation = equation[0] as typeof equation;
	}
	let left = valueAt(0);
	let right: Decimal;
	let operator: Operator;
	for (let i = 1; i < equation.length; i += 2) {
		operator = operatorAt(i);
		right = valueAt(i + 1);
		left = operator(left, right);
	}
	return left;

	function valueAt(idx: number) {
		return Decimal(equation[idx] as Val);
	}
	function operatorAt(idx: number) {
		let op = equation[idx] as Op;
		if (typeof op === "string") {
			op = operators[op];
		}
		return op;
	}
};

export interface Operator {
	T?: Decimal;
	(left: {} & this["T"], right: {} & this["T"]): {} & this["T"];
}

export interface Decimal {
	readonly int: bigint;
	readonly pow: number;
}

export function Decimal(input: number | string | Decimal): Decimal {
	if (typeof input === "object") {
		return input;
	}
	let int: bigint;
	let pow: number;
	if (typeof input === "string") {
		let pointIdx = input.indexOf(".");
		if (pointIdx === -1) {
			int = BigInt(input);
			pow = 0;
		} else {
			int = BigInt(input.replace(".", ""));
			pow = input.length - pointIdx - 1;
		}
	} else {
		pow = 0;
		while (!Number.isInteger(input)) {
			input *= 10;
			pow++;
		}
		int = BigInt(input);
	}

	return {
		int,
		pow,
	};
}

export const plus: Operator = (l, r) => {
	let pow = Math.max(l.pow, r.pow);
	r = scaleUp(r, pow);
	l = scaleUp(l, pow);
	return {
		int: l.int + r.int,
		pow,
	};
};

export const minus: Operator = (l, r) => {
	let pow = l.pow;
	if (l.pow < r.pow) r = scaleUp(r, l.pow);
	if (r.pow < l.pow) l = scaleUp(l, (pow = r.pow));
	return {
		int: l.int - r.int,
		pow,
	};
};

export const times: Operator = (l, r) => {
	if (l.int === 0n || r.int === 0n) {
		return { int: 0n, pow: 0 };
	}
	return {
		int: l.int * r.int,
		pow: l.pow + r.pow,
	};
};

export const mod: Operator = (l, r) => {
	// FIXME: didn't test, might not work
	return {
		int: l.int % r.int,
		pow: l.pow - r.pow,
	};
};

export const format = (Decimal.format = (decimal: Decimal) => {
	decimal = scaleDown(decimal);
	let string = String(decimal.int);
	let intsEnd = string.length - decimal.pow;
	let decs = string.slice(intsEnd);
	let ints = string.slice(0, intsEnd) || "0";
	if (decs !== "") {
		ints = `${ints}.${decs}`;
	}
	return ints;
});

export const scaleUp = (Decimal.scaleUp = (
	decimal: Decimal,
	targetPower: number,
): Decimal => {
	if (decimal.pow === targetPower) {
		return decimal;
	}
	let factor = BigInt(10 ** (targetPower - decimal.pow));
	return {
		int: decimal.int * factor,
		pow: targetPower,
	};
});

export const scaleDown = (Decimal.scaleDown = (decimal: Decimal): Decimal => {
	if (decimal.pow === 0) {
		return decimal;
	}
	let { int, pow } = decimal;
	while (int % 10n === 0n) {
		int = int / 10n;
		pow--;
	}
	return { int, pow };
});

type OperatorKey = keyof typeof operators;
const operators = {
	"+": plus,
	"-": minus,
	"*": times,
	"%": mod,
};

// type Arr = Array<Literal | Op>;
// // type Alternating<A extends Exp, B extends Exp = A> = B extends []
// // 	? A
// // 	: B extends [Literal, Op?, ...infer Rest extends Exp]
// // 	? Alternating<A, Rest>
// // 	: [...A, Literal, Op?]

// type Alternating<
// 	V extends { a: {}; b: {} },
// 	Self extends V[keyof V][],
// 	Good extends any[] = [],
// 	Other extends V[keyof V] = V["a"],
// > = Self extends []
// 	? Good
// 	: Self extends [Other, ...infer Rest extends V[keyof V][]]
// 		? Alternating<
// 				V,
// 				Rest,
// 				[...Good, Other],
// 				Other extends V["a"] ? V["b"] : V["a"]
// 			>
// 		: Good;

// type Complete<T extends Arr> = T extends [...Arr, Literal]
// 	? [...T, Op?]
// 	: T extends [...Arr, Literal, Op]
// 		? [...T, Literal]
// 		: T;

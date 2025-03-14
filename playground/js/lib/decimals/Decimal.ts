type MAX_OPERANDS = 2;

type Literal = Decimal | number;
type Op = Operator | OperatorKey;

type CalcExpression<
	TOverloads extends (...equation: any[]) => any = (
		...args: [arg: Literal, operator: Op, arg: Literal]
	) => Decimal,
	I extends ReadonlyArray<number> = [],
> = I["length"] extends MAX_OPERANDS
	? TOverloads
	: CalcExpression<
			TOverloads &
				((
					...args: [...Parameters<TOverloads>, ...[operator: Op, arg: Literal]]
				) => Decimal),
			[...I, 1]
		>;

export const calc: CalcExpression = (...equation) => {
	let left = literalAt(0);
	let right: Decimal;
	let operator: Operator;
	for (let i = 1; i < equation.length; i += 2) {
		operator = opAt(i);
		right = literalAt(i + 1);
		left = operator(left, right);
	}
	return left;

	function literalAt(idx: number) {
		return Decimal(equation[idx] as Literal);
	}
	function opAt(idx: number) {
		const op = equation[idx] as Op;
		if (typeof op === "string") {
			return operators[op];
		} else {
			return op;
		}
	}
};

export interface Operator {
	(left: Decimal, right: Decimal): Decimal;
}

export interface Decimal {
	readonly int: bigint;
	readonly pow: number;
}

export function Decimal(input: number | string | Decimal): Decimal {
	const MAX_SAFE_EXPONENT = 20;
	if (typeof input === "object") {
		if (input.pow < 0) {
			throw new Error("Power cannot be negative");
		}
		return input;
	}
	let int: bigint;
	let pow: number;
	if (typeof input === "string") {
		pow = input.slice(input.indexOf(".")).length - 1;
		int = BigInt(input.replace(".", ""));
	} else {
		pow = 0;
		while (!Number.isInteger(input * 10 ** pow) && pow < MAX_SAFE_EXPONENT) {
			pow++;
		}
		int = BigInt(input * 10 ** pow);
	}

	return {
		int,
		pow,
	};
}

export const plus: Operator = (l, r) => {
	let pow = l.pow;
	if (l.pow > r.pow) r = scaleUp(r, l.pow);
	if (r.pow > l.pow) l = scaleUp(l, (pow = r.pow));
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

export const format = (decimal: Decimal) => {
	decimal = scaleDown(decimal);
	const string = String(decimal.int);
	const intsEnd = string.length - decimal.pow;
	const ints = string.slice(0, intsEnd);
	const decs = string.slice(intsEnd);
	const parts: string[] = [];
	if (ints === "") {
		parts.push("0");
	} else {
		parts.push(ints);
	}
	if (decs !== "") {
		parts.push(decs);
	}
	return parts.join(".");
};
Decimal.format = format;

export const scaleUp = (decimal: Decimal, targetPower: number): Decimal => {
	if (decimal.pow === targetPower) {
		return decimal;
	}
	const factor = BigInt(10 ** (targetPower - decimal.pow));
	return {
		int: decimal.int * factor,
		pow: targetPower,
	};
};
Decimal.scaleUp = scaleUp;

export const scaleDown = (decimal: Decimal): Decimal => {
	if (decimal.pow === 0) {
		return decimal;
	}
	let { int, pow } = decimal;
	while (int % 10n === 0n) {
		int = int / 10n;
		pow--;
	}
	return { int, pow };
};
Decimal.scaleDown = scaleDown;

type OperatorKey = keyof typeof operators;
const operators = {
	"+": plus,
	"-": minus,
	"*": times,
	"%": mod,
};

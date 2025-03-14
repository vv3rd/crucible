import { describe, expect, test } from "bun:test";
import { calc, Decimal, minus, Operator, plus, times } from "./Decimal";

type Case = [
	caseDescription: string,
	leftLiteral: number,
	rightLiteral: number,
	operationResult: number,
];

describe.only("plus", () => {
	testCases(plus, {
		associative: true,
		withZeros: [
			["0 & 0", 0, 0, 0],
			["0 & int", 0, 5, 5],
			["0 & float", 0, 5.5, 5.5],

			["-0 & -0", -0, -0, -0],
			["-0 & int", -0, 5, 5],
			["-0 & float", -0, 5.5, 5.5],
		],
		powerDiff: [
			["int & int", 3, 3, 6],
			["float & float", 3.1, 3.1, 6.2],
			["float2 & float", 3.01, 3.1, 6.11],
			["int & float", 3, 3.1, 6.1],
			["float & -int", 3.4, -3, 0.4],
		],
	});
});

describe("minus", () => {
	testCases(minus, {
		associative: false,
		withZeros: [
			["0 & 0", 0, 0, 0],
			["0 & int", 0, 5, 5],
			["0 & float", 0, 5.5, 5.5],

			["-0 & -0", -0, -0, -0],
			["-0 & int", -0, 5, 5],
			["-0 & float", -0, 5.5, 5.5],
		],
		powerDiff: [
			["int & int", 3, 3, 6],
			["float & float", 3.1, 3.1, 6.2],
			["float2 & float", 3.01, 3.1, 6.11],
			["int & float", 3, 3.1, 6.1],
			["float & -int", 3.4, -3, 0.4],
		],
	});
});

describe.only("times", () => {
	// fails
	testCases(times, {
		associative: true,
		withZeros: [
			["0 & 0", 0, 0, 0],
			["0 & int", 0, 5, 0],
			["0 & float", 0, 5.5, 0],

			["-0 & -0", -0, -0, -0],
			["-0 & int", -0, 5, 0],
			["-0 & float", -0, 5.5, 0],
		],
		powerDiff: [
			["int & int", 3, 3, 9],
			["float & float", 3.1, 3.1, 9.61],
			["float2 & float", 3.01, 3.1, 9.331],
			["int & float", 3, 3.4, 10.2],
			// ["20 & 0.25", 20, 0.25, 5],
			// ["20 * 1.25", 20, 1.25, 25],
		],
	});
});

describe.only("scaling", () => {
	test("scales down to 0", () => {
		expect(Decimal.scaleDown({ int: 2500n, pow: 2 })).toEqual(Decimal(25));
	});
	test('does not scale more', () => {
		expect(Decimal.scaleDown({ int: 250n, pow: 3 })).toEqual(Decimal(0.25));
	})
});

function testCases(
	operator: Operator,
	{
		withZeros,
		powerDiff,
		associative,
	}: {
		withZeros: Case[];
		powerDiff: Case[];
		associative: boolean;
	},
) {
	const flip = (desc: string): string =>
		desc.split(" & ").reverse().join(" & ");

	describe("with zero", () => {
		for (const [desc, l, r, out] of withZeros) {
			{
				testCalc(desc, l, r, operator, out);
			}
			if (associative) {
				testCalc(flip(desc), r, l, operator, out);
			}
		}
	});

	describe("power diff", () => {
		for (const [desc, l, r, out] of powerDiff) {
			{
				testCalc(desc, l, r, operator, out);
			}
			if (associative) {
				testCalc(flip(desc), r, l, operator, out);
			}
		}
	});
}

function testCalc(
	desc: string,
	left: number,
	right: number,
	op: Operator,
	out: number,
) {
	test(desc, () => {
		const calcResult = calc(left, op, right);
		return expect(Decimal.format(calcResult)).toEqual(String(out));
	});
}

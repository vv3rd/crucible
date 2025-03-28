import { describe as libDescribe, expect, test } from "bun:test";
import { calc, Decimal, minus, Operator, plus, times } from "./Decimal";

type Case = [
    caseDescription: string,
    leftLiteral: number,
    rightLiteral: number,
    operationResult: number,
];

const describe = libDescribe.skip;

describe("plus", () => {
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
            ["0 & int", 0, 5, -5],
            ["0 & float", 0, 5.5, -5.5],

            ["-0 & -0", -0, -0, -0],
            ["-0 & int", -0, 5, -5],
            ["-0 & float", -0, 5.5, -5.5],
        ],
        powerDiff: [
            ["int & int", 4, 3, 1],
            ["float & float", 12.1, 3.2, 8.9],
            ["float2 & float", 21.01, 3.1, 6.11],
            ["int & float", 3, 3.1, 6.1],
            ["float & -int", 3.4, -3, 0.4],
        ],
    });
});

describe("times", () => {
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
    const flip = (desc: string): string => desc.split(" & ").reverse().join(" & ");

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

function testCalc(desc: string, left: number, right: number, op: Operator, out: number) {
    test(desc, () => {
        const calcResult = calc(left, op, right);
        return expect(Decimal.format(calcResult)).toEqual(out.toString());
    });
}

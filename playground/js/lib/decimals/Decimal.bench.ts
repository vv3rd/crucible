import { barplot, bench, run, do_not_optimize, k_state } from "mitata";
import { Decimal } from "./Decimal";

const numbers = Array.from({ length: 5 }, (_, i) => 10 ** (i * 3) * Math.random());
const strings = Array.from(numbers, (number) => number.toString());

barplot(() => {
    bench("Decimal(string $input)", function* (state: k_state) {
        const string = state.get("input");
        yield () => do_not_optimize(Decimal(string));
    }).args("input", strings);
});

barplot(() => {
    bench("Decimal(number $input)", function* (state: k_state) {
        const number = state.get("input");
        yield () => do_not_optimize(Decimal(number));
    }).args("input", numbers);
});

await run();

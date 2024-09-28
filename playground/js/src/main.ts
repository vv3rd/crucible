import { useMemo } from "react";
import { createStore } from "zustand";
import { useStore } from "zustand";
import { StateCreator } from "zustand/vanilla";

type FormState<TValues> = {
	fields: TValues;
	flags: { [K in keyof TValues]: number };
	change: <K extends keyof TValues>(key: K, value: TValues[K]) => void;
	blur: <K extends keyof TValues>(key: K) => void;
};

const UNTOUCHED = 0;
const MODIFIED = 1;
const BLURED = 2;

function defineFormState<TValues extends Record<string, any>>(
	initialValues: TValues,
): StateCreator<FormState<TValues>> {
	return (set) => ({
		fields: initialValues,
		flags: Object.fromEntries(
			Object.keys(initialValues).map((key) => [key, UNTOUCHED]),
		) as { [K in keyof TValues]: number },
		change: (key, value) =>
			set((prev) => ({
				fields: { ...prev.fields, [key]: value },
				flags: {
					...prev.flags,
					[key]: Math.max(prev.flags[key], MODIFIED),
				},
			})),
		blur: (key) =>
			set((prev) => {
				if (prev.flags[key] !== MODIFIED) {
					return prev;
				}
				return {
					flags: { ...prev.flags, [key]: BLURED },
				};
			}),
	});
}

function selectFormState<TValues extends Record<string, any>>(
	state: FormState<TValues>,
) {}

useStore(
	useMemo(() => createStore(defineFormState({ kek: "" })), []),
	selectFormState,
);

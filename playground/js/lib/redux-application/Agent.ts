import { Message, Selectable, StateRoot } from "./types";
import { Reducer } from "./Reducer";
import { areArraysEqual, memoLast } from "../toolkit/memoLast";

// TODO:
// the Atoms problem is not solved until I figure out a way to specify
// how to select atoms module from global state
export namespace Atom {
	export function create<TValue, TMsg extends Message>(
		name: string,
		reducer: Reducer<TValue, TMsg>,
	): Atom<TValue, TMsg> {
		// TODO: atom got to have an address and a way to address it
		// derived atom then can be defined with a addresser function
		const self: Atom<TValue, TMsg> = {
			reduce: reducer,
			select: (globalState) => {
				const container = globalState["atoms"][name];
				if (!container) {
					return { value: Reducer.initialize(reducer), sources };
				}
				return select(container);
			},
		};
		const sources = new Set([self]);
		const select = memoLast((containerState: AtonContainer<TValue>) => ({
			value: containerState.value,
			sources,
		}));
		return self;
	}

	export function derive<T>(
		getValue: (getter: <V>(atom: Atom<V, any>) => V) => T,
	): ReadonlyAtom<T> {
		let sources: Set<Atom<unknown, Message>>;
		let lastResult: AtomOutput<T> | undefined;
		let lastSourceValues: unknown[] = [];
		const sourcesAreUnchanged = (globalState: StateRoot) => {
			const currentSourceValues = [...sources].map(
				(source) => source.select(globalState).value,
			);
			return areArraysEqual(currentSourceValues, lastSourceValues);
		};

		return {
			select(globalState: StateRoot) {
				if (lastResult && sourcesAreUnchanged(globalState)) {
					return lastResult;
				}

				sources = new Set();
				const value = getValue((atom) => {
					const selection = atom.select(globalState);
					for (const d of selection.sources) {
						sources.add(d);
					}
					return selection.value;
				});
				return (lastResult = {
					value: value,
					sources,
				});
			},
		};
	}

	export function constant<T>(value: T): ReadonlyAtom<T> {
		const result: AtomOutput<T> = { value, sources: [] };
		return {
			select: () => result,
		};
	}
}

type Sources = Iterable<Atom<any, any>>;

type AtomOutput<TState> = {
	value: TState;
	sources: Sources;
};

type AtonContainer<T> = {
	value: T;
};

interface ReadonlyAtom<T> extends Selectable<AtomOutput<T>> {}

interface Atom<TState, TMsg extends Message> extends ReadonlyAtom<TState> {
	// TODO: somewhere here must be an .address method to send msg to this
	// specific atom
	reduce: Reducer<TState, TMsg>;
}

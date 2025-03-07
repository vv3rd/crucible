import { Message, Selectable, StateRoot } from "./types";
import { Reducer } from "./Reducer";
import { areArraysEqual, memoLast } from "../toolkit/memoLast";

// TODO:
// the Agents problem is not solved until I figure out a way to specify
// how to select agents module from global state
export namespace Agent {
	export function create<TValue, TMsg extends Message>(
		name: string,
		reducer: Reducer<TValue, TMsg>,
	): Agent<TValue, TMsg> {
		// TODO: agent got to have an adderss and a way to address it
		// deriveed agent then can be defined with a adresser function
		const self: Agent<TValue, TMsg> = {
			reduce: reducer,
			select: (globalState) => {
				const container = globalState["agents"][name];
				if (!container) {
					return { value: Reducer.initialize(reducer), sources };
				}
				return select(container);
			},
		};
		const sources = new Set([self]);
		const select = memoLast((containerState: AgentContainer<TValue>) => ({
			value: containerState.value,
			sources,
		}));
		return self;
	}

	export function derive<T>(
		getValue: (getter: <V>(agent: Agent<V, any>) => V) => T,
	): ReadonlyAgent<T> {
		let sources: Set<Agent<unknown, Message>>;
		let lastResult: AgentOutput<T> | undefined;
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
				const value = getValue((agent) => {
					const selection = agent.select(globalState);
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

	export function constant<T>(value: T): ReadonlyAgent<T> {
		const result: AgentOutput<T> = { value, sources: [] };
		return {
			select: () => result,
		};
	}
}

type Sources = Iterable<Agent<any, any>>;

type AgentOutput<TState> = {
	value: TState;
	sources: Sources;
};

type AgentContainer<T> = {
	value: T;
};

interface ReadonlyAgent<T> extends Selectable<AgentOutput<T>> {}

interface Agent<TState, TMsg extends Message> extends ReadonlyAgent<TState> {
	// TODO: somewhere here must be an .address method to send msg to this
	// specific agent
	reduce: Reducer<TState, TMsg>;
}

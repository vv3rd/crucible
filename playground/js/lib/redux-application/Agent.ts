import { Message } from "./types";
import { Reducer } from "./Reducer";
import { areArraysEqual, memoLast } from "../toolkit/memoLast";

// TODO:
// the Agents problem is not solved until I figure out a way to specify
// how to select agenst module from global state
export namespace Agent {
	export function create<TValue, TMsg extends Message>(
		name: string,
		reducer: Reducer<TValue, TMsg>,
	): Agent<TValue, TMsg> {
		// TODO: agent got to have an adderss and a way to address it
		// deriveed agent then can be defined with a adresser function
		const self: Agent<TValue, TMsg> = {
			reduce: reducer,
			select: (globalState: GlobalState<TValue>) => {
				const container = globalState.agents[name];
				return container ? select(container) : initial;
			},
		};
		const sources = new Set([self]);
		const initial = {
			value: Reducer.initialize(reducer),
			sources,
		};
		const select = memoLast((containerState: AgentContainer<TValue>) => ({
			value: containerState.value,
			sources,
		}));
		return self;
	}

	export function derive<T>(
		getValue: (getter: <V>(agent: Agent<V, any>) => V) => T,
	) {
		let sources: Set<Agent<unknown, Message>>;
		let lastResult: AgentSelectorResult<T> | undefined;
		let lastSourceValues: unknown[] = [];
		const sourcesAreUnchanged = (globalState: GlobalState<T>) => {
			const currentSourceValues = [...sources].map(
				(source) => source.select(globalState).value,
			);
			return areArraysEqual(currentSourceValues, lastSourceValues);
		};

		return {
			select(globalState: GlobalState<T>) {
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

	// TODO: type in overloads
	export function injection<T>(
		name: string, // FIXME: injection should not require a name, it defeats the point
		properties: { optional?: boolean } = {},
	) {
		const { optional = false } = properties;
		const sources: Sources = [];
		const select = memoLast(
			(containerState: AgentContainer<T>): AgentSelectorResult<T> => ({
				value: containerState.value,
				sources,
			}),
		);
		const fallback: AgentSelectorResult<undefined> = {
			value: undefined,
			sources,
		};
		return {
			select(globalState: GlobalState<T>) {
				const container = globalState.agents[name];
				if (container) {
					return select(container);
				}
				if (optional) {
					return fallback;
				} else {
					throw new Error("Non optional injection requires requires an agent");
				}
			},
		};
	}
}

type Sources = Iterable<Agent<any, any>>;

type AgentSelectorResult<TState> = {
	value: TState;
	sources: Sources;
};

type Agent<TState, TMsg extends Message> = {
	reduce: Reducer<TState, TMsg>;
	select: (globalState: GlobalState<any>) => AgentSelectorResult<TState>;
};

type AgentContainer<T> = {
	value: T;
};

type GlobalState<T> = {
	agents: {
		[key in string]: AgentContainer<T>;
	};
};

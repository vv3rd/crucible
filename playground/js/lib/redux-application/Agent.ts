import { Reducer, Message } from "./types";

type AgentImpl<TState, TMsg extends Message> = {
	reduce: Reducer<TState, TMsg>;
	select: () => TState;
};

const TypeSymbol = Symbol();

type AgentToken<A extends AgentImpl<any, any>> = {
	displayName?: string;
	[TypeSymbol]: A;
};

type AgentValueSelector = <TAgentValue>(
	agent: AgentToken<AgentImpl<TAgentValue, any>>,
) => TAgentValue;

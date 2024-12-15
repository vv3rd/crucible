import { Reducer } from "./reduxTypes";

type AgentImpl<S, A> = {
	reduce: Reducer<S, A>;
	select: () => S;
};

const TypeSymbol = Symbol();

type AgentToken<A extends AgentImpl<any, any>> = {
	displayName?: string;
	[TypeSymbol]: A;
};

type AgentValueSelector = <TAgentValue>(
	agent: AgentToken<AgentImpl<TAgentValue, any>>,
) => TAgentValue;

const getDerivedAgent =
	<TGlobalState>(
		resolve: <A extends AgentImpl<any, any>>(agentToken: AgentToken<A>) => A,
	) =>
	<TResult>(describeDerivition: (select: AgentValueSelector) => TResult) =>
	(state: TGlobalState) => {
		const select: AgentValueSelector = (agentToken) => {
			const agentImpl = resolve(agentToken);
		};
	};

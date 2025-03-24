import { Reducer } from "./Reducer";
import { createWireUtils, WiredReducer, WiringRoot } from "./Wire";
import { TaskScheduler } from "./Task";
import { Msg } from "./Message";

export interface Atom<TValue, TMsg extends Msg> {
	address: string;
	reducer: Reducer<TValue, AtomMsg<TMsg>>;
	envelope: (message: TMsg) => AtomMsg.Envelope<TMsg>;
	select: (root: WiringRoot) => Atom.Out<TValue, TMsg>;
	// TODO: consider if somewhere here must be an .address
	// method to send msg to this specific atom
}

export interface DerivedAtom<TValue> {
	select: (root: WiringRoot) => Atom.DerivedOut<TValue>;
}

export function Atom<TValue, TMsg extends Msg>(
	address: string,
	reducer: Reducer<TValue, AtomMsg<TMsg>>,
	customContext = Atom.defaultContext,
): Atom<TValue, TMsg> {
	const ctx = customContext;
	let cache: Atom.Out<TValue, TMsg> | undefined;
	const self: Atom<TValue, TMsg> = {
		address: address,
		reducer: reducer,
		envelope: (msg) => AtomMsg.to(self, msg, ctx.rootName),
		select: (root) => {
			const maybeValue = ctx.selectRoot(root).__atomValues[address];
			let value: TValue;
			if (maybeValue === void 0) {
				value = Reducer.initialize(reducer);
			} else {
				value = maybeValue as TValue;
			}
			if (cache && Object.is(cache.value, value)) {
				return cache;
			}
			return {
				value,
				mount,
				unmount,
				sources,
				envelope: self.envelope,
			};
		},
	};
	const sources = new Set([self]);
	const mount = () => AtomMsg.mount(sources, ctx.rootName);
	const unmount = () => AtomMsg.unmount(sources, ctx.rootName);
	return self;
}

export namespace Atom {
	export interface Sources extends Iterable<AnyAtom> {}
	export interface SourcesArray extends Array<AnyAtom> {}
	export interface SourcesSet extends Set<AnyAtom> {}

	export interface DerivedOut<TValue> {
		value: TValue;
		sources: Sources;
		mount: () => AtomMsg.Mount;
		unmount: () => AtomMsg.Unmount;
	}

	export interface Out<TValue, TMsg extends Msg> extends DerivedOut<TValue> {
		envelope: (message: TMsg) => AtomMsg.Envelope<TMsg>;
	}

	export type Value<T> = T & {
		readonly AtomValue: unique symbol;
	};

	export interface Root {
		__atomValues: {
			[key: string]: Value<unknown>;
		};
		__atomReducers: {
			[key: string]: Reducer<Value<unknown>, AtomMsg<Msg>>;
		};
	}

	export interface RootInstance extends WiredReducer<Root, Msg> {}

	export interface Context {
		selectRoot: RootInstance["select"];
		rootName: string;
	}

	export const defaultRoot = createAtomsRootImpl("atoms");

	export const defaultContext: Context = {
		selectRoot: Atom.defaultRoot.select,
		rootName: Atom.defaultRoot.name,
	};

	export function derive<T>(
		getValue: (getter: <V>(atom: Atom<V, any>) => V) => T,
		context = defaultContext,
	): DerivedAtom<T> {
		let lastResult: DerivedOut<T> | undefined;
		let lastSources: SourcesArray = [];
		let lastSourcesResults: DerivedOut<any>[] = [];

		return {
			select(globalState: WiringRoot) {
				if (
					lastResult &&
					lastSources.some((source, idx) => source.select(globalState) !== lastSourcesResults[idx])
				) {
					return lastResult;
				}

				const currentSources: SourcesSet = new Set<AnyAtom>();
				const value = getValue((atom) => {
					const { value, sources } = atom.select(globalState);
					for (const s of sources) {
						currentSources.add(s);
					}
					return value;
				});

				const mount = () => AtomMsg.mount(currentSources, context.rootName);
				const unmount = () => AtomMsg.unmount(currentSources, context.rootName);

				lastSources = [...currentSources];
				lastSourcesResults = lastSources.map((source) => source.select(globalState));
				lastResult = { value, sources: currentSources, mount, unmount };
				return lastResult;
			},
		};
	}
}

type AnyAtom = Atom<any, any>;

export type AtomMsg<TMsg extends Msg> = TMsg;

export function AtomMsg() {}

export namespace AtomMsg {
	export type Mount = ReturnType<typeof mount>;
	export function mount(atoms: Iterable<AnyAtom>, rootName: string = Atom.defaultRoot.name) {
		return {
			type: `${rootName}/mountingAtoms` as const,
			payload: atoms,
		};
	}
	mount.match = (msg: Msg, rootName: string = Atom.defaultRoot.name): msg is Mount =>
		msg.type === `${rootName}/mountingAtoms`;

	export type Unmount = ReturnType<typeof unmount>;
	export function unmount(atoms: Iterable<AnyAtom>, rootName: string = Atom.defaultRoot.name) {
		return {
			type: `${rootName}/unmountingAtoms` as const,
			payload: atoms,
		};
	}
	unmount.match = (msg: Msg, rootName: string = Atom.defaultRoot.name): msg is Unmount =>
		msg.type === `${rootName}/unmountingAtoms`;

	export type Envelope<TMsg extends Msg> = ReturnType<typeof to<TMsg>>;
	export function to<TMsg extends Msg>(
		atom: Atom<any, TMsg>,
		message: TMsg,
		rootName: string = Atom.defaultRoot.name,
	) {
		return {
			type: `${rootName}/to-atom:${atom.address}/-/${message.type}`,
			address: atom.address,
			payload: message,
		};
	}
	to.match = (msg: Msg, rootName: string = Atom.defaultRoot.name): msg is Envelope<any> =>
		msg.type.startsWith(`${rootName}/to-atom:`);
}

function createAtomsRootImpl(rootName: string) {
	type AtomRootMsg = AtomMsg.Mount | AtomMsg.Unmount | AtomMsg.Envelope<any>;

	const [connectWire, selectIt] = createWireUtils<Atom.Root>();

	const atomsRootReducer: Reducer<Atom.Root, AtomRootMsg> = (
		rootState = { __atomValues: {}, __atomReducers: {} },
		msg,
		exec,
	) => {
		connectWire(msg, exec);

		if (AtomMsg.to.match(msg)) {
			// TODO: what to do when atom is not mounted? log a warning?
			const currentAtoms = rootState.__atomValues;
			let nextAtoms = currentAtoms;
			for (const address in rootState.__atomReducers) {
				const reducer = rootState.__atomReducers[address]!;
				const scopedExec = TaskScheduler.scoped(exec, (s) => s.__atomValues[address]!);
				const valueWas = currentAtoms?.[address];
				const valueNow = reducer(valueWas, msg.payload, scopedExec);
				if (valueWas !== valueNow) {
					if (nextAtoms === currentAtoms) {
						nextAtoms = { ...currentAtoms };
					}
					nextAtoms[address] = valueNow;
				}
			}
			if (nextAtoms !== currentAtoms) {
				rootState = { ...rootState, __atomValues: nextAtoms };
			}
		}

		if (AtomMsg.mount.match(msg, rootName)) {
			const newAtoms = [...msg.payload]
				.filter((atom) => !(atom.address in rootState.__atomReducers))
				.map(({ address, reducer }) => ({
					value: reducer(undefined, { type: "Mount" }, exec),
					reducer: reducer,
					address,
				}));
			const newValues = Object.fromEntries(newAtoms.map((a) => [a.address, a.value]));
			const newReducers = Object.fromEntries(newAtoms.map((a) => [a.address, a.reducer]));
			rootState = { ...rootState };
			rootState.__atomValues = { ...rootState.__atomValues, ...newValues };
			rootState.__atomReducers = { ...rootState.__atomReducers, ...newReducers };
		}

		if (AtomMsg.unmount.match(msg, rootName)) {
			rootState = { ...rootState };
			rootState.__atomValues = { ...rootState.__atomValues };
			rootState.__atomReducers = { ...rootState.__atomReducers };
			for (const { address } of msg.payload) {
				const value = rootState.__atomValues[address];
				const reducer = rootState.__atomReducers[address];
				if (!reducer) {
					continue;
				}
				const scopedExec = TaskScheduler.scoped(exec, (s) => s.__atomValues[address]!);
				reducer(value, { type: "Unmount" }, scopedExec);
				delete rootState.__atomValues[address];
				delete rootState.__atomReducers[address];
			}
		}

		return rootState;
	};

	const context = {
		selectRoot: selectIt,
		rootName: rootName,
	};

	const createAtom = <TValue, TMsg extends Msg>(
		address: string,
		reducer: Reducer<TValue, AtomMsg<TMsg>>,
	) => Atom(address, reducer, context);

	const deriveAtom = <T>(getValue: (getter: <V>(atom: Atom<V, any>) => V) => T): DerivedAtom<T> =>
		Atom.derive(getValue, context);

	return {
		name: rootName,
		reducer: atomsRootReducer,
		select: selectIt,
		createAtom: createAtom,
		deriveAtom: deriveAtom,
	};
}

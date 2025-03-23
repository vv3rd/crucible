import { Message } from "./types";
import { Reducer } from "./Reducer";
import { createWired, WiredReducer, WiringRoot } from "./Wire";
import { TaskScheduler } from "./Task";

interface Atom<TValue, TMsg extends Message> {
	address: string;
	reducer: Reducer<TValue, AtomMsg<TMsg>>;
	package: (message: TMsg) => void;
	select: (root: WiringRoot) => Atom.Result<TValue, TMsg>;
	// TODO: consider if somewhere here must be an .address
	// method to send msg to this specific atom
}

interface DerivedAtom<TValue> {
	select: (root: WiringRoot) => Atom.DerivedResult<TValue>;
}

export function Atom<TValue, TMsg extends Message>(
	address: string,
	reducer: Reducer<TValue, AtomMsg<TMsg>>,
	context = Atom.defaultContext,
): Atom<TValue, TMsg> {
	let cache: Atom.Result<TValue, TMsg> | undefined;
	const self: Atom<TValue, TMsg> = {
		address: address,
		reducer: reducer,
		package: (msg) => AtomMsg.to(self, msg, context.rootName),
		select: (root) => {
			const maybeValue = context.selectRoot(root).__atomValues[address];
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
				package: self.package,
			};
		},
	};
	const sources = new Set([self]);
	const mount = () => AtomMsg.mount(sources, context.rootName);
	const unmount = () => AtomMsg.unmount(sources, context.rootName);
	return self;
}

export namespace Atom {
	export interface Sources extends Iterable<AnyAtom> {}
	export interface SourcesArray extends Array<AnyAtom> {}
	export interface SourcesSet extends Set<AnyAtom> {}

	export interface DerivedResult<TValue> {
		value: TValue;
		sources: Sources;
		mount: () => AtomMsg.Mount;
		unmount: () => AtomMsg.Unmount;
	}

	export interface Result<TValue, TMsg extends Message> extends DerivedResult<TValue> {
		package: (message: TMsg) => void;
	}

	export type Value<T> = T & {
		readonly AtomValue: unique symbol;
	};

	export interface Root {
		__atomValues: {
			[key: string]: Value<unknown>;
		};
		__atomReducers: {
			[key: string]: Reducer<Value<unknown>, AtomMsg<Message>>;
		};
	}

	export interface RootInstance extends WiredReducer<Root, Message> {}

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
		let lastResult: DerivedResult<T> | undefined;
		let lastSources: SourcesArray = [];
		let lastSourcesResults: DerivedResult<any>[] = [];

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

export type AtomMsg<TMsg extends Message> = TMsg | Message<"Mount"> | Message<"Unmount">;

export function AtomMsg() {}

export namespace AtomMsg {
	export type Mount = ReturnType<typeof mount>;
	export function mount(atoms: Iterable<AnyAtom>, rootName: string = Atom.defaultRoot.name) {
		return {
			type: `${rootName}/mountingAtoms` as const,
			payload: atoms,
		};
	}
	mount.match = (msg: Message, rootName: string = Atom.defaultRoot.name): msg is Mount =>
		msg.type === `${rootName}/mountingAtoms`;

	export type Unmount = ReturnType<typeof unmount>;
	export function unmount(atoms: Iterable<AnyAtom>, rootName: string = Atom.defaultRoot.name) {
		return {
			type: `${rootName}/unmountingAtoms` as const,
			payload: atoms,
		};
	}
	unmount.match = (msg: Message, rootName: string = Atom.defaultRoot.name): msg is Unmount =>
		msg.type === `${rootName}/unmountingAtoms`;

	export type To = ReturnType<typeof to>;
	export function to<TMsg extends Message>(
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
	to.match = (msg: Message, rootName: string = Atom.defaultRoot.name): msg is To =>
		msg.type.startsWith(`${rootName}/to-atom:`);
}

function createAtomsRootImpl(rootName: string) {
	type Msg = AtomMsg.Mount | AtomMsg.Unmount | AtomMsg.To;
	type State = Atom.Root;

	const initialState: State = { __atomValues: {}, __atomReducers: {} };

	const atomsRootReducer = createWired<State, Msg>((state = initialState, msg, exec) => {
		if (AtomMsg.to.match(msg)) {
			const currentAtoms = state.__atomValues;
			let nextAtoms = currentAtoms;
			for (const address in state.__atomReducers) {
				const reducer = state.__atomReducers[address]!;
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
				state = { ...state, __atomValues: nextAtoms };
			}
		}

		if (AtomMsg.mount.match(msg, rootName)) {
			const newAtoms = [...msg.payload]
				.filter((atom) => !(atom.address in state.__atomReducers))
				.map(({ address, reducer }) => ({
					value: reducer(undefined, { type: "Mount" }, exec),
					reducer: reducer,
					address,
				}));
			const newValues = Object.fromEntries(newAtoms.map((a) => [a.address, a.value]));
			const newReducers = Object.fromEntries(newAtoms.map((a) => [a.address, a.reducer]));
			state = { ...state };
			state.__atomValues = { ...state.__atomValues, ...newValues };
			state.__atomReducers = { ...state.__atomReducers, ...newReducers };
		}

		if (AtomMsg.unmount.match(msg, rootName)) {
			state = { ...state };
			state.__atomValues = { ...state.__atomValues };
			state.__atomReducers = { ...state.__atomReducers };
			for (const { address } of msg.payload) {
				const value = state.__atomValues[address];
				const reducer = state.__atomReducers[address];
				if (!reducer) {
					continue;
				}
				const scopedExec = TaskScheduler.scoped(exec, (s) => s.__atomValues[address]!);
				reducer(value, { type: "Unmount" }, scopedExec);
				delete state.__atomValues[address];
				delete state.__atomReducers[address];
			}
		}

		return state;
	});
	const selectRoot = atomsRootReducer.select;
	const context = {
		selectRoot,
		rootName: rootName,
	};

	const createAtom = <TValue, TMsg extends Message>(
		address: string,
		reducer: Reducer<TValue, AtomMsg<TMsg>>,
	) => Atom(address, reducer, context);

	const deriveAtom = <T>(getValue: (getter: <V>(atom: Atom<V, any>) => V) => T): DerivedAtom<T> =>
		Atom.derive(getValue, context);

	return {
		name: rootName,
		reducer: atomsRootReducer,
		select: selectRoot,
		createAtom: createAtom,
		deriveAtom: deriveAtom,
	};
}

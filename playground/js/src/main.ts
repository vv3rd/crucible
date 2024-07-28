function createStore() {
	return {
		get() {},
		set() {},
		sub() {},
	};
}

type Getter = any
type Setter = any


type Orb<T> = {
	
}

function createOrb(creator: (get: Getter, set: Setter) => any) {}

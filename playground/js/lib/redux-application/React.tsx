import React, {
  createContext,
  use,
  useCallback,
  useContext,
  useSyncExternalStore,
} from "react";
import { Store } from "./Store";

const StoreContext = createContext<Store<any, any> | null>(null);

function StoreProvider({
  store,
  children,
}: {
  store: Store<any, any>;
  children?: React.ReactNode;
}) {
  return <StoreContext value={store}>{children}</StoreContext>;
}

function useStore() {
  const store = use(StoreContext);
  if (store == null) {
    throw new Error("Have StoreContext");
  }
  return store;
}

export interface StoreRegistry {
  global: any;
}

export function useSelector<T, S extends keyof StoreRegistry = "global">(
  selector: (state: StoreRegistry[S]) => T,
) {
  const store = useStore();
  const snapshot = useCallback(() => selector(store.getState()), [selector]);
  const value = useSyncExternalStore(store.subscribe, snapshot, snapshot);
  return value;
}

export function useDispatch() {
  const store = useStore();
  return store.dispatch;
}

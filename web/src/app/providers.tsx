"use client";

import { useEffect } from "react";
import { Provider } from "react-redux";
import { loadAuthFromStorage, saveAuthToStorage, setHydrated, setSession } from "@/store/authSlice";
import { store } from "@/store/store";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const persisted = loadAuthFromStorage();
    if (persisted?.user && persisted.accessToken && persisted.refreshToken) {
      store.dispatch(
        setSession({
          user: persisted.user,
          accessToken: persisted.accessToken,
          refreshToken: persisted.refreshToken,
        })
      );
    }
    store.dispatch(setHydrated());

    const unsubscribe = store.subscribe(() => {
      saveAuthToStorage(store.getState().auth);
    });
    return unsubscribe;
  }, []);

  return <Provider store={store}>{children}</Provider>;
}


"use client";

import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { User } from "@/lib/types";

const STORAGE_KEY = "brushslot_auth_v1";

export type AuthState = {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  hydrated: boolean;
};

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  hydrated: false,
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setSession: (
      state,
      action: PayloadAction<{
        user: User;
        accessToken: string;
        refreshToken: string;
      }>
    ) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
    },
    clearSession: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
    },
    setHydrated: (state) => {
      state.hydrated = true;
    },
  },
});

export const { setSession, clearSession, setHydrated } = authSlice.actions;
export default authSlice.reducer;

export function loadAuthFromStorage(): Omit<AuthState, "hydrated"> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Omit<AuthState, "hydrated">;
    if (!parsed?.accessToken || !parsed?.refreshToken || !parsed?.user) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveAuthToStorage(state: AuthState) {
  if (typeof window === "undefined") return;
  try {
    const toSave: Omit<AuthState, "hydrated"> = {
      user: state.user,
      accessToken: state.accessToken,
      refreshToken: state.refreshToken,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch {
    // ignore
  }
}


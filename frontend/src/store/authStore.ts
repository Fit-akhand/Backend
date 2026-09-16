import { create } from "zustand";
import type { AuthStatus, User } from "@/types/api";
import { authApi } from "@/services/api/auth";
import { tokenMemory } from "@/lib/tokenMemory";

type AuthState = {
  user: User | null;
  status: AuthStatus;
  bootstrap: () => Promise<void>;
  login: (input: { email?: string; username?: string; password: string }) => Promise<void>;
  register: (form: FormData) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: "loading",
  bootstrap: async () => {
    try {
      const user = await authApi.currentUser();
      set({ user, status: "authenticated" });
    } catch {
      tokenMemory.clear();
      set({ user: null, status: "unauthenticated" });
    }
  },
  login: async (input) => {
    const data = await authApi.login(input);
    set({ user: data.user, status: "authenticated" });
  },
  register: async (form) => {
    await authApi.register(form);
  },
  logout: async () => {
    try {
      await authApi.logout();
    } finally {
      set({ user: null, status: "unauthenticated" });
    }
  },
  setUser: (user) => set({ user, status: "authenticated" }),
}));

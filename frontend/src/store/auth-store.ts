import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { RolePermissions } from "@/lib/permissions";

interface User {
  id: string;
  name: string;
  email: string;
  roleId: string | null;
  permissions?: RolePermissions | null;
}

interface Tenant {
  id: string;
  name: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  tenant: Tenant | null;
  setAuth: (token: string, user: User, tenant: Tenant) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      tenant: null,
      setAuth: (token, user, tenant) => {
        if (typeof window !== "undefined") localStorage.setItem("crm_token", token);
        set({ token, user, tenant });
      },
      logout: () => {
        if (typeof window !== "undefined") localStorage.removeItem("crm_token");
        set({ token: null, user: null, tenant: null });
      },
      isAuthenticated: () => !!get().token,
    }),
    { name: "crm-auth", partialize: (s) => ({ token: s.token, user: s.user, tenant: s.tenant }) }
  )
);

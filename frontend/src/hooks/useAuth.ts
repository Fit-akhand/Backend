import { useAuthStore } from "@/store/authStore";

export const useAuth = () => {
  const user = useAuthStore((s) => s.user);
  const status = useAuthStore((s) => s.status);
  const login = useAuthStore((s) => s.login);
  const logout = useAuthStore((s) => s.logout);
  const register = useAuthStore((s) => s.register);
  const bootstrap = useAuthStore((s) => s.bootstrap);

  return {
    user,
    status,
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading",
    login,
    logout,
    register,
    bootstrap,
  };
};

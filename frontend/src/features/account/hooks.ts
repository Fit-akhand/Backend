import { useMutation } from "@tanstack/react-query";
import { authApi } from "@/services/api/auth";
import { useAuthStore } from "@/store/authStore";

export const useUpdateAccount = () => {
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation({
    mutationFn: (body: { fullname: string; email: string }) =>
      authApi.updateAccount(body),
    onSuccess: (user) => setUser(user),
  });
};

export const useUpdateAvatar = () => {
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation({
    mutationFn: (form: FormData) => authApi.updateAvatar(form),
    onSuccess: (user) => setUser(user),
  });
};

export const useUpdateCover = () => {
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation({
    mutationFn: (form: FormData) => authApi.updateCover(form),
    onSuccess: (user) => setUser(user),
  });
};

export const useChangePassword = () =>
  useMutation({
    mutationFn: (body: { oldPassword: string; newPassword: string }) =>
      authApi.changePassword(body),
  });

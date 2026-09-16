import { useQuery } from "@tanstack/react-query";
import { authApi } from "@/services/api/auth";
import { useAuthStore } from "@/store/authStore";

export const historyKeys = {
  all: ["history"] as const,
};

export const useWatchHistory = () => {
  const status = useAuthStore((s) => s.status);
  return useQuery({
    queryKey: historyKeys.all,
    queryFn: () => authApi.history(),
    enabled: status === "authenticated",
  });
};

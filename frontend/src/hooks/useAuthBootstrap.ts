import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";

export const useAuthBootstrap = () => {
  const bootstrap = useAuthStore((s) => s.bootstrap);
  const status = useAuthStore((s) => s.status);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  return status;
};

import { QueryClient } from "@tanstack/react-query";
import { AppApiError } from "@/lib/apiError";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (count, error) => {
        if (error instanceof AppApiError && [401, 403, 404].includes(error.status)) {
          return false;
        }
        return count < 1;
      },
      refetchOnWindowFocus: false,
    },
  },
});

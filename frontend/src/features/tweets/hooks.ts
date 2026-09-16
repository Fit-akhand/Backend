import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { tweetsApi } from "@/services/api/tweets";
import { useAuthStore } from "@/store/authStore";

export const tweetKeys = {
  user: (userId: string, page: number) => ["tweets", userId, page] as const,
  allForUser: (userId: string) => ["tweets", userId] as const,
};

export const useUserTweets = (userId: string | undefined, page = 1) => {
  const status = useAuthStore((s) => s.status);
  return useQuery({
    queryKey: tweetKeys.user(userId ?? "", page),
    queryFn: () => tweetsApi.listByUser(userId!, { page, limit: 10 }),
    enabled: status !== "loading" && Boolean(userId),
  });
};

export const useCreateTweet = (userId: string | undefined) => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => tweetsApi.create(content),
    onSuccess: () => {
      if (userId) void client.invalidateQueries({ queryKey: tweetKeys.allForUser(userId) });
    },
  });
};

export const useUpdateTweet = (userId: string | undefined) => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ tweetId, content }: { tweetId: string; content: string }) =>
      tweetsApi.update(tweetId, content),
    onSuccess: () => {
      if (userId) void client.invalidateQueries({ queryKey: tweetKeys.allForUser(userId) });
    },
  });
};

export const useDeleteTweet = (userId: string | undefined) => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (tweetId: string) => tweetsApi.remove(tweetId),
    onSuccess: () => {
      if (userId) void client.invalidateQueries({ queryKey: tweetKeys.allForUser(userId) });
    },
  });
};

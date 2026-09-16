import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { commentsApi } from "@/services/api/comments";
import { useAuthStore } from "@/store/authStore";

export const commentKeys = {
  list: (videoId: string, page: number) =>
    ["comments", videoId, page] as const,
  allForVideo: (videoId: string) => ["comments", videoId] as const,
};

export const useComments = (videoId: string | undefined, page: number) => {
  const status = useAuthStore((s) => s.status);
  return useQuery({
    queryKey: commentKeys.list(videoId ?? "", page),
    queryFn: () => commentsApi.list(videoId!, { page, limit: 10 }),
    enabled: status !== "loading" && Boolean(videoId),
  });
};

export const useCreateComment = (videoId: string | undefined) => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => commentsApi.create(videoId!, content),
    onSuccess: () => {
      if (!videoId) return;
      void client.invalidateQueries({ queryKey: commentKeys.allForVideo(videoId) });
    },
  });
};

export const useUpdateComment = (videoId: string | undefined) => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ commentId, content }: { commentId: string; content: string }) =>
      commentsApi.update(commentId, content),
    onSuccess: () => {
      if (!videoId) return;
      void client.invalidateQueries({ queryKey: commentKeys.allForVideo(videoId) });
    },
  });
};

export const useDeleteComment = (videoId: string | undefined) => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) => commentsApi.remove(commentId),
    onSuccess: () => {
      if (!videoId) return;
      void client.invalidateQueries({ queryKey: commentKeys.allForVideo(videoId) });
    },
  });
};

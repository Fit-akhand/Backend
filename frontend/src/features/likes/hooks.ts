import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { likesApi } from "@/services/api/likes";
import { useAuthStore } from "@/store/authStore";
import type { VideoLikeState } from "@/types/api";

export const likeKeys = {
  video: (videoId: string) => ["likes", "video", videoId] as const,
  list: ["likes", "videos"] as const,
};

export const useVideoLikeState = (videoId: string | undefined) => {
  const status = useAuthStore((s) => s.status);
  return useQuery({
    queryKey: likeKeys.video(videoId ?? ""),
    queryFn: async (): Promise<VideoLikeState> => {
      // API has no per-video like status; infer membership from liked list (max 50).
      const page = await likesApi.likedVideos({ page: 1, limit: 50 });
      const liked = page.results.some((v) => v._id === videoId);
      return { liked, likes: null };
    },
    enabled: status === "authenticated" && Boolean(videoId),
    staleTime: 60_000,
  });
};

export const useToggleVideoLike = (videoId: string | undefined) => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => likesApi.toggleVideo(videoId!),
    onSuccess: (data) => {
      if (!videoId) return;
      client.setQueryData<VideoLikeState>(likeKeys.video(videoId), {
        liked: data.liked,
        likes: data.likes,
      });
      void client.invalidateQueries({ queryKey: likeKeys.list });
    },
  });
};

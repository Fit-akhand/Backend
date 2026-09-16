import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { videosApi, type VideoListQuery } from "@/services/api/videos";
import { dashboardApi } from "@/services/api/dashboard";
import { useAuthStore } from "@/store/authStore";

export const videoKeys = {
  all: ["videos"] as const,
  list: (params: VideoListQuery) => ["videos", "list", params] as const,
  detail: (id: string) => ["videos", "detail", id] as const,
};

export const dashboardKeys = {
  stats: ["dashboard", "stats"] as const,
  videos: (page: number, limit: number) =>
    ["dashboard", "videos", page, limit] as const,
};

export const useVideos = (params: VideoListQuery) => {
  const status = useAuthStore((s) => s.status);
  return useQuery({
    queryKey: videoKeys.list(params),
    queryFn: () => videosApi.list(params),
    enabled: status !== "loading",
  });
};

/**
 * Fetches a video once. Backend increments views + writes watch history on GET,
 * so we avoid refetch-on-focus / remount thrashing.
 */
export const useVideo = (videoId: string | undefined) => {
  const status = useAuthStore((s) => s.status);
  return useQuery({
    queryKey: videoKeys.detail(videoId ?? ""),
    queryFn: () => videosApi.getById(videoId!),
    enabled: status !== "loading" && Boolean(videoId),
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: (count, error) => {
      const statusCode = (error as { status?: number })?.status;
      if (statusCode === 404 || statusCode === 401) return false;
      return count < 1;
    },
  });
};

export const useInvalidateVideos = () => {
  const client = useQueryClient();
  return () => client.invalidateQueries({ queryKey: videoKeys.all });
};

const invalidateAfterVideoMutation = async (
  client: ReturnType<typeof useQueryClient>
) => {
  await Promise.all([
    client.invalidateQueries({ queryKey: videoKeys.all }),
    client.invalidateQueries({ queryKey: ["dashboard"] }),
    client.invalidateQueries({ queryKey: ["channel"] }),
    client.invalidateQueries({ queryKey: ["history"] }),
    client.invalidateQueries({ queryKey: ["subscriptions"] }),
    client.invalidateQueries({ queryKey: ["playlists"] }),
  ]);
};

export const useDashboardStats = () => {
  const status = useAuthStore((s) => s.status);
  return useQuery({
    queryKey: dashboardKeys.stats,
    queryFn: () => dashboardApi.stats(),
    enabled: status === "authenticated",
  });
};

export const useDashboardVideos = (page = 1, limit = 12) => {
  const status = useAuthStore((s) => s.status);
  return useQuery({
    queryKey: dashboardKeys.videos(page, limit),
    queryFn: () => dashboardApi.videos({ page, limit }),
    enabled: status === "authenticated",
  });
};

export const usePublishVideo = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (form: FormData) => videosApi.publish(form),
    onSuccess: () => void invalidateAfterVideoMutation(client),
  });
};

export const useUpdateVideo = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      videoId,
      body,
    }: {
      videoId: string;
      body: FormData | { title?: string; description?: string };
    }) => videosApi.update(videoId, body),
    onSuccess: async (video) => {
      client.setQueryData(videoKeys.detail(video._id), video);
      await invalidateAfterVideoMutation(client);
    },
  });
};

export const useDeleteVideo = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (videoId: string) => videosApi.remove(videoId),
    onSuccess: () => void invalidateAfterVideoMutation(client),
  });
};

export const useTogglePublish = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (videoId: string) => videosApi.togglePublish(videoId),
    onSuccess: (video) => {
      client.setQueryData(videoKeys.detail(video._id), video);
      void invalidateAfterVideoMutation(client);
    },
  });
};

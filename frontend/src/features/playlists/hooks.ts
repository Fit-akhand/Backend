import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { playlistsApi } from "@/services/api/playlists";
import { useAuthStore } from "@/store/authStore";

export const playlistKeys = {
  all: ["playlists"] as const,
  user: (userId: string) => ["playlists", "user", userId] as const,
  detail: (id: string) => ["playlists", "detail", id] as const,
};

export const useUserPlaylists = (userId: string | undefined) => {
  const status = useAuthStore((s) => s.status);
  return useQuery({
    queryKey: playlistKeys.user(userId ?? ""),
    queryFn: () => playlistsApi.byUser(userId!),
    enabled: status === "authenticated" && Boolean(userId),
  });
};

export const usePlaylist = (playlistId: string | undefined) => {
  const status = useAuthStore((s) => s.status);
  return useQuery({
    queryKey: playlistKeys.detail(playlistId ?? ""),
    queryFn: () => playlistsApi.getById(playlistId!),
    enabled: status === "authenticated" && Boolean(playlistId),
  });
};

const invalidatePlaylists = (
  client: ReturnType<typeof useQueryClient>,
  userId?: string,
  playlistId?: string
) => {
  void client.invalidateQueries({ queryKey: playlistKeys.all });
  if (userId) void client.invalidateQueries({ queryKey: playlistKeys.user(userId) });
  if (playlistId) {
    void client.invalidateQueries({ queryKey: playlistKeys.detail(playlistId) });
  }
};

export const useCreatePlaylist = () => {
  const client = useQueryClient();
  const userId = useAuthStore((s) => s.user?._id);
  return useMutation({
    mutationFn: (body: { name: string; description: string }) =>
      playlistsApi.create(body),
    onSuccess: () => invalidatePlaylists(client, userId),
  });
};

export const useUpdatePlaylist = () => {
  const client = useQueryClient();
  const userId = useAuthStore((s) => s.user?._id);
  return useMutation({
    mutationFn: ({
      playlistId,
      body,
    }: {
      playlistId: string;
      body: { name?: string; description?: string };
    }) => playlistsApi.update(playlistId, body),
    onSuccess: (_data, vars) =>
      invalidatePlaylists(client, userId, vars.playlistId),
  });
};

export const useDeletePlaylist = () => {
  const client = useQueryClient();
  const userId = useAuthStore((s) => s.user?._id);
  return useMutation({
    mutationFn: (playlistId: string) => playlistsApi.remove(playlistId),
    onSuccess: () => invalidatePlaylists(client, userId),
  });
};

export const useAddVideoToPlaylist = () => {
  const client = useQueryClient();
  const userId = useAuthStore((s) => s.user?._id);
  return useMutation({
    mutationFn: ({
      playlistId,
      videoId,
    }: {
      playlistId: string;
      videoId: string;
    }) => playlistsApi.addVideo(playlistId, videoId),
    onSuccess: (_data, vars) =>
      invalidatePlaylists(client, userId, vars.playlistId),
  });
};

export const useRemoveVideoFromPlaylist = () => {
  const client = useQueryClient();
  const userId = useAuthStore((s) => s.user?._id);
  return useMutation({
    mutationFn: ({
      playlistId,
      videoId,
    }: {
      playlistId: string;
      videoId: string;
    }) => playlistsApi.removeVideo(playlistId, videoId),
    onSuccess: (_data, vars) =>
      invalidatePlaylists(client, userId, vars.playlistId),
  });
};

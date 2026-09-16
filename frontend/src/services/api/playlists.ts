import { apiClient, unwrap } from "@/services/api/client";
import type { Playlist } from "@/types/api";

export const playlistsApi = {
  create: (body: { name: string; description: string }) =>
    unwrap<Playlist>(apiClient.post("/playlist", body)),
  byUser: (userId: string) =>
    unwrap<Playlist[]>(apiClient.get(`/playlist/user/${userId}`)),
  getById: (playlistId: string) =>
    unwrap<Playlist>(apiClient.get(`/playlist/${playlistId}`)),
  update: (playlistId: string, body: { name?: string; description?: string }) =>
    unwrap<Playlist>(apiClient.patch(`/playlist/${playlistId}`, body)),
  remove: (playlistId: string) =>
    unwrap<Record<string, never>>(apiClient.delete(`/playlist/${playlistId}`)),
  addVideo: (playlistId: string, videoId: string) =>
    unwrap<Playlist>(apiClient.patch(`/playlist/add/${videoId}/${playlistId}`)),
  removeVideo: (playlistId: string, videoId: string) =>
    unwrap<Playlist>(
      apiClient.patch(`/playlist/remove/${videoId}/${playlistId}`)
    ),
};

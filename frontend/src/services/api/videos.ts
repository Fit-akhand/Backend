import { apiClient, unwrap } from "@/services/api/client";
import type { Paginated, Video } from "@/types/api";

export type VideoListQuery = {
  page?: number;
  limit?: number;
  query?: string;
  sortBy?: "createdAt" | "views" | "title" | "duration";
  sortType?: "asc" | "desc";
  userId?: string;
};

const UPLOAD_TIMEOUT_MS = 10 * 60 * 1000;

export const videosApi = {
  list: (params: VideoListQuery = {}) =>
    unwrap<Paginated<Video>>(apiClient.get("/videos", { params })),
  getById: (videoId: string) => unwrap<Video>(apiClient.get(`/videos/${videoId}`)),
  publish: (form: FormData) =>
    unwrap<Video>(
      apiClient.post("/videos", form, { timeout: UPLOAD_TIMEOUT_MS })
    ),
  update: (videoId: string, body: FormData | { title?: string; description?: string }) =>
    unwrap<Video>(
      apiClient.patch(`/videos/${videoId}`, body, {
        timeout: body instanceof FormData ? UPLOAD_TIMEOUT_MS : 20000,
      })
    ),
  remove: (videoId: string) =>
    unwrap<Record<string, never>>(apiClient.delete(`/videos/${videoId}`)),
  togglePublish: (videoId: string) =>
    unwrap<Video>(apiClient.patch(`/videos/toggle/publish/${videoId}`)),
};

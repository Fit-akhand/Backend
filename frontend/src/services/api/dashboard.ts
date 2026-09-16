import { apiClient, unwrap } from "@/services/api/client";
import type { DashboardStats, Paginated, Video } from "@/types/api";

export const dashboardApi = {
  stats: () => unwrap<DashboardStats>(apiClient.get("/dashboard/stats")),
  videos: (params: { page?: number; limit?: number } = {}) =>
    unwrap<Paginated<Video>>(apiClient.get("/dashboard/videos", { params })),
};

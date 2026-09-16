import { apiClient, unwrap } from "@/services/api/client";
import type { Comment, Paginated } from "@/types/api";

export const commentsApi = {
  list: (videoId: string, params: { page?: number; limit?: number } = {}) =>
    unwrap<Paginated<Comment>>(
      apiClient.get(`/comments/${videoId}`, { params })
    ),
  create: (videoId: string, content: string) =>
    unwrap<Comment>(apiClient.post(`/comments/${videoId}`, { content })),
  update: (commentId: string, content: string) =>
    unwrap<Comment>(apiClient.patch(`/comments/c/${commentId}`, { content })),
  remove: (commentId: string) =>
    unwrap<Record<string, never>>(apiClient.delete(`/comments/c/${commentId}`)),
};

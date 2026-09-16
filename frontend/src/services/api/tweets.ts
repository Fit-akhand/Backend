import { apiClient, unwrap } from "@/services/api/client";
import type { Paginated, Tweet } from "@/types/api";

export const tweetsApi = {
  listByUser: (userId: string, params: { page?: number; limit?: number } = {}) =>
    unwrap<Paginated<Tweet>>(apiClient.get(`/tweets/user/${userId}`, { params })),
  create: (content: string) =>
    unwrap<Tweet>(apiClient.post("/tweets", { content })),
  update: (tweetId: string, content: string) =>
    unwrap<Tweet>(apiClient.patch(`/tweets/${tweetId}`, { content })),
  remove: (tweetId: string) =>
    unwrap<Record<string, never>>(apiClient.delete(`/tweets/${tweetId}`)),
};

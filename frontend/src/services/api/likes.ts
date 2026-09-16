import { apiClient, unwrap } from "@/services/api/client";
import type { Paginated, Video } from "@/types/api";

export type VideoLikeToggle = {
  liked: boolean;
  likes: number;
};

export const likesApi = {
  toggleVideo: (videoId: string) =>
    unwrap<VideoLikeToggle>(apiClient.post(`/likes/toggle/v/${videoId}`)),
  likedVideos: (params: { page?: number; limit?: number } = {}) =>
    unwrap<Paginated<Video>>(apiClient.get("/likes/videos", { params })),
};

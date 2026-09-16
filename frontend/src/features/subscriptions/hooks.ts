import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { channelsApi } from "@/services/api/channels";
import { subscriptionsApi } from "@/services/api/subscriptions";
import { videosApi } from "@/services/api/videos";
import { useAuthStore } from "@/store/authStore";
import type { Video, VideoOwner } from "@/types/api";

export const channelKeys = {
  profile: (username: string) => ["channel", username] as const,
  videos: (userId: string, page: number) =>
    ["channel", "videos", userId, page] as const,
};

export const useChannel = (username: string | undefined) => {
  const status = useAuthStore((s) => s.status);
  return useQuery({
    queryKey: channelKeys.profile(username ?? ""),
    queryFn: () => channelsApi.byUsername(username!),
    enabled: status !== "loading" && Boolean(username),
  });
};

export const useChannelVideos = (
  userId: string | undefined,
  page: number,
  limit = 12
) => {
  const status = useAuthStore((s) => s.status);
  return useQuery({
    queryKey: channelKeys.videos(userId ?? "", page),
    queryFn: () =>
      videosApi.list({
        userId,
        page,
        limit,
        sortBy: "createdAt",
        sortType: "desc",
      }),
    enabled: status !== "loading" && Boolean(userId),
  });
};

export const useToggleSubscription = (username: string | undefined) => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (channelId: string) => subscriptionsApi.toggle(channelId),
    onSuccess: (data) => {
      if (!username) return;
      client.setQueryData(channelKeys.profile(username), (prev: unknown) => {
        if (!prev || typeof prev !== "object") return prev;
        const channel = prev as {
          isSubscribed: boolean;
          subscriberCount: number;
        };
        const delta =
          data.subscribed === channel.isSubscribed
            ? 0
            : data.subscribed
              ? 1
              : -1;
        return {
          ...channel,
          isSubscribed: data.subscribed,
          subscriberCount: Math.max(0, channel.subscriberCount + delta),
        };
      });
      void client.invalidateQueries({ queryKey: channelKeys.profile(username) });
      void client.invalidateQueries({ queryKey: ["subscriptions"] });
    },
  });
};

export const subscriptionKeys = {
  channels: (subscriberId: string) =>
    ["subscriptions", "channels", subscriberId] as const,
  feed: (subscriberId: string) => ["subscriptions", "feed", subscriberId] as const,
};

export const useSubscribedChannels = (subscriberId: string | undefined) => {
  const status = useAuthStore((s) => s.status);
  return useQuery({
    queryKey: subscriptionKeys.channels(subscriberId ?? ""),
    queryFn: () => subscriptionsApi.subscribedChannels(subscriberId!),
    enabled: status === "authenticated" && Boolean(subscriberId),
  });
};

export const useSubscriptionsFeed = (subscriberId: string | undefined) => {
  const status = useAuthStore((s) => s.status);
  const channelsQuery = useSubscribedChannels(subscriberId);
  const channelIds = (channelsQuery.data?.channels ?? [])
    .filter((channel): channel is VideoOwner => Boolean(channel?._id))
    .map((channel) => channel._id);

  const feedQuery = useQuery({
    queryKey: subscriptionKeys.feed(subscriberId ?? ""),
    queryFn: async () => {
      const pages = await Promise.all(
        channelIds.map((userId) =>
          videosApi.list({
            userId,
            page: 1,
            limit: 8,
            sortBy: "createdAt",
            sortType: "desc",
          })
        )
      );
      const videos = pages.flatMap((page) => page.results);
      videos.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      return videos as Video[];
    },
    enabled:
      status === "authenticated" &&
      Boolean(subscriberId) &&
      channelsQuery.isSuccess &&
      channelIds.length > 0,
  });

  return { channelsQuery, feedQuery, channelIds };
};

import { apiClient, unwrap } from "@/services/api/client";
import type { VideoOwner } from "@/types/api";

export type ToggleSubscriptionResult = {
  subscribed: boolean;
};

export type ChannelSubscribers = {
  subscribers: VideoOwner[];
  subscriberCount: number;
};

export type SubscribedChannels = {
  channels: VideoOwner[];
  subscribedCount: number;
};

export const subscriptionsApi = {
  toggle: (channelId: string) =>
    unwrap<ToggleSubscriptionResult>(
      apiClient.post(`/subscriptions/c/${channelId}`)
    ),
  subscribers: (channelId: string) =>
    unwrap<ChannelSubscribers>(apiClient.get(`/subscriptions/c/${channelId}`)),
  subscribedChannels: (subscriberId: string) =>
    unwrap<SubscribedChannels>(apiClient.get(`/subscriptions/u/${subscriberId}`)),
};

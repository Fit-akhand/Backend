import { apiClient, unwrap } from "@/services/api/client";
import type { ChannelProfile } from "@/types/api";

/** Public-facing channel fields — never surface email in the UI. */
export type SafeChannelProfile = Omit<ChannelProfile, "email">;

export const channelsApi = {
  byUsername: async (username: string): Promise<SafeChannelProfile> => {
    const data = await unwrap<ChannelProfile>(
      apiClient.get(`/users/c/${encodeURIComponent(username)}`)
    );
    const { email: _email, ...safe } = data;
    return safe;
  },
};

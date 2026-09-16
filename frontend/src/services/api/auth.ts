import { apiClient, unwrap } from "@/services/api/client";
import { tokenMemory } from "@/lib/tokenMemory";
import type { ChannelProfile, LoginResponse, User, Video } from "@/types/api";

const IMAGE_TIMEOUT_MS = 2 * 60 * 1000;

export const authApi = {
  login: async (input: { email?: string; username?: string; password: string }) => {
    const data = await unwrap<LoginResponse>(apiClient.post("/users/login", input));
    tokenMemory.set(data.accessToken, data.refreshToken);
    return data;
  },
  register: async (form: FormData) => {
    return unwrap<User>(apiClient.post("/users/register", form));
  },
  currentUser: () => unwrap<User>(apiClient.get("/users/current_user")),
  logout: async () => {
    try {
      await unwrap<Record<string, never>>(apiClient.post("/users/logout"));
    } finally {
      tokenMemory.clear();
    }
  },
  channel: (username: string) =>
    unwrap<ChannelProfile>(apiClient.get(`/users/c/${encodeURIComponent(username)}`)),
  history: () => unwrap<Video[]>(apiClient.get("/users/History")),
  updateAccount: (body: { fullname: string; email: string }) =>
    unwrap<User>(apiClient.patch("/users/update_account", body)),
  updateAvatar: (form: FormData) =>
    unwrap<User>(apiClient.patch("/users/avater", form, { timeout: IMAGE_TIMEOUT_MS })),
  updateCover: (form: FormData) =>
    unwrap<User>(
      apiClient.patch("/users/cover_image", form, { timeout: IMAGE_TIMEOUT_MS })
    ),
  changePassword: (body: { oldPassword: string; newPassword: string }) =>
    unwrap<Record<string, never>>(apiClient.post("/users/change_password", body)),
};

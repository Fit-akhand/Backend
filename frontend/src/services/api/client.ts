import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { config } from "@/app/config/env";
import { AppApiError } from "@/lib/apiError";
import { tokenMemory } from "@/lib/tokenMemory";
import type { ApiErrorBody, ApiSuccess } from "@/types/api";

const SKIP_REFRESH = new Set([
  "/users/login",
  "/users/register",
  "/users/refresh-token",
  "/healthcheck",
  "/ready",
]);

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean };

export const apiClient = axios.create({
  baseURL: config.apiBaseUrl,
  timeout: 20000,
  withCredentials: true,
});

apiClient.interceptors.request.use((req) => {
  req.headers.set("X-Request-ID", crypto.randomUUID());
  const token = tokenMemory.getAccess();
  if (token) {
    req.headers.set("Authorization", `Bearer ${token}`);
  }
  return req;
});

const toApiError = (error: AxiosError<ApiErrorBody>) => {
  if (!error.response) {
    return new AppApiError({
      message: "Network error",
      status: 0,
      code: "NETWORK_ERROR",
    });
  }
  const body = error.response.data;
  return new AppApiError({
    message: body?.message || error.message,
    status: error.response.status,
    code: body?.errorCode || "ERROR",
    fieldErrors: body?.errors ?? [],
    requestId: body?.requestId,
  });
};

let refreshPromise: Promise<boolean> | null = null;

const refreshSession = async () => {
  const refreshToken = tokenMemory.getRefresh();
  const response = await axios.post<ApiSuccess<{ accessToken: string; refreshToken: string }>>(
    `${config.apiBaseUrl}/users/refresh-token`,
    refreshToken ? { refreshToken } : {},
    { withCredentials: true, timeout: 20000 }
  );
  tokenMemory.set(response.data.data.accessToken, response.data.data.refreshToken);
  return true;
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorBody>) => {
    const original = error.config as RetryConfig | undefined;
    const url = original?.url ?? "";
    const skip = [...SKIP_REFRESH].some((path) => url.includes(path));

    if (error.response?.status === 401 && original && !original._retry && !skip) {
      original._retry = true;
      try {
        refreshPromise = refreshPromise ?? refreshSession();
        await refreshPromise;
        refreshPromise = null;
        return apiClient(original);
      } catch {
        refreshPromise = null;
        tokenMemory.clear();
      }
    }

    return Promise.reject(toApiError(error));
  }
);

export const unwrap = <T>(promise: Promise<{ data: ApiSuccess<T> }>) =>
  promise.then((res) => res.data.data);

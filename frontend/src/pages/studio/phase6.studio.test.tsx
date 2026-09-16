import type { ReactElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppApiError } from "@/lib/apiError";
import { useAuthStore } from "@/store/authStore";
import { ToastProvider } from "@/components/ui/Toast";
import { VidzoraLogo } from "@/brand/VidzoraLogo";
import { LandingPage } from "@/pages/home/LandingPage";
import { DashboardPage } from "@/pages/studio/DashboardPage";
import { UploadPage } from "@/pages/studio/UploadPage";
import { MyVideosPage } from "@/pages/studio/MyVideosPage";
import { PlaylistsPage } from "@/pages/playlists/PlaylistsPage";
import { PlaylistDetailPage } from "@/pages/playlists/PlaylistDetailPage";
import { HistoryPage } from "@/pages/history/HistoryPage";
import { SubscriptionsPage } from "@/pages/subscriptions/SubscriptionsPage";
import { ProtectedRoute } from "@/components/common/RouteGuards";
import { dashboardApi } from "@/services/api/dashboard";
import { videosApi } from "@/services/api/videos";
import { playlistsApi } from "@/services/api/playlists";
import { authApi } from "@/services/api/auth";
import { subscriptionsApi } from "@/services/api/subscriptions";

vi.mock("@/services/api/dashboard", () => ({
  dashboardApi: {
    stats: vi.fn(),
    videos: vi.fn(),
  },
}));

vi.mock("@/services/api/videos", () => ({
  videosApi: {
    list: vi.fn(),
    getById: vi.fn(),
    publish: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    togglePublish: vi.fn(),
  },
}));

vi.mock("@/services/api/playlists", () => ({
  playlistsApi: {
    create: vi.fn(),
    byUser: vi.fn(),
    getById: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    addVideo: vi.fn(),
    removeVideo: vi.fn(),
  },
}));

vi.mock("@/services/api/auth", () => ({
  authApi: {
    history: vi.fn(),
    currentUser: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
    channel: vi.fn(),
    updateAccount: vi.fn(),
    updateAvatar: vi.fn(),
    updateCover: vi.fn(),
    changePassword: vi.fn(),
  },
}));

vi.mock("@/services/api/subscriptions", () => ({
  subscriptionsApi: {
    toggle: vi.fn(),
    subscribers: vi.fn(),
    subscribedChannels: vi.fn(),
  },
}));

const userFixture = {
  _id: "u1",
  username: "ada",
  email: "ada@example.com",
  fullname: "Ada Lovelace",
  avatar: "https://example.com/a.png",
};

const videoFixture = {
  _id: "v1",
  videoFile: "https://example.com/v.mp4",
  thumbnail: "https://example.com/t.jpg",
  owner: userFixture._id,
  title: "Studio clip",
  description: "Desc",
  duration: 12,
  views: 4,
  isPublished: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const page = (results: typeof videoFixture[] = []) => ({
  results,
  page: 1,
  limit: 12,
  total: results.length,
  totalPages: results.length ? 1 : 0,
  hasNextPage: false,
  hasPreviousPage: false,
});

const withProviders = (ui: ReactElement, route = "/") => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <ToastProvider>
        <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
};

beforeEach(() => {
  useAuthStore.setState({ user: userFixture, status: "authenticated" });
});

afterEach(() => {
  cleanup();
  useAuthStore.setState({ user: null, status: "unauthenticated" });
  vi.clearAllMocks();
});

describe("Vidzora branding", () => {
  it("renders logo variants with accessible names", () => {
    render(
      <>
        <VidzoraLogo variant="icon" />
        <VidzoraLogo variant="compact" />
        <VidzoraLogo variant="full" />
      </>
    );
    expect(screen.getAllByRole("img", { name: /Vidzora/i }).length).toBeGreaterThan(1);
    expect(screen.getByText("Watch. Create. Connect.")).toBeInTheDocument();
  });

  it("shows Vidzora on the landing page", () => {
    withProviders(<LandingPage />);
    expect(screen.getByText("Watch. Create. Connect.")).toBeInTheDocument();
    expect(screen.queryByText("ak_tube")).not.toBeInTheDocument();
  });
});

describe("protected creator routes", () => {
  it("sends guests away from studio", () => {
    useAuthStore.setState({ status: "unauthenticated", user: null });
    withProviders(
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<p>Studio live</p>} />
        </Route>
        <Route path="/login" element={<p>Login screen</p>} />
      </Routes>,
      "/dashboard"
    );
    expect(screen.getByText("Login screen")).toBeInTheDocument();
  });
});

describe("creator dashboard", () => {
  it("shows real stats", async () => {
    vi.mocked(dashboardApi.stats).mockResolvedValue({
      totalVideos: 2,
      totalViews: 10,
      totalLikes: 3,
      totalComments: 1,
      totalSubscribers: 5,
    });
    vi.mocked(dashboardApi.videos).mockResolvedValue(page([videoFixture]));
    withProviders(<DashboardPage />);
    expect(await screen.findByText("Creator Studio")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("Studio clip")).toBeInTheDocument();
  });

  it("shows empty videos and error", async () => {
    vi.mocked(dashboardApi.stats).mockResolvedValue({
      totalVideos: 0,
      totalViews: 0,
      totalLikes: 0,
      totalComments: 0,
      totalSubscribers: 0,
    });
    vi.mocked(dashboardApi.videos).mockResolvedValue(page([]));
    withProviders(<DashboardPage />);
    expect(await screen.findByText("No videos yet")).toBeInTheDocument();
  });

  it("shows dashboard error", async () => {
    vi.mocked(dashboardApi.stats).mockRejectedValue(
      new AppApiError({ message: "no", status: 401 })
    );
    withProviders(<DashboardPage />);
    expect(await screen.findByText("Could not load studio")).toBeInTheDocument();
  });
});

describe("upload", () => {
  it("validates required files and fields", async () => {
    const user = userEvent.setup();
    withProviders(<UploadPage />);
    await user.click(screen.getByRole("button", { name: /publish video/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/title is required/i);
    expect(videosApi.publish).not.toHaveBeenCalled();
  });

  it("rejects invalid video type", async () => {
    const user = userEvent.setup();
    withProviders(<UploadPage />);
    await user.type(screen.getByLabelText(/^title$/i), "My upload");
    await user.type(screen.getByLabelText(/^description$/i), "A description");
    const videoInput = screen.getByLabelText(/^video file$/i);
    const thumbInput = screen.getByLabelText(/^thumbnail$/i);
    fireEvent.change(videoInput, {
      target: { files: [new File(["x"], "clip.txt", { type: "text/plain" })] },
    });
    fireEvent.change(thumbInput, {
      target: { files: [new File(["x"], "t.png", { type: "image/png" })] },
    });
    await user.click(screen.getByRole("button", { name: /publish video/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/MP4/i);
    expect(videosApi.publish).not.toHaveBeenCalled();
  });

  it("publishes with FormData fields", async () => {
    vi.mocked(videosApi.publish).mockResolvedValue(videoFixture);
    const user = userEvent.setup();
    withProviders(
      <Routes>
        <Route path="/studio/upload" element={<UploadPage />} />
        <Route path="/watch/:videoId" element={<p>Watch</p>} />
      </Routes>,
      "/studio/upload"
    );
    await user.type(screen.getByLabelText(/^title$/i), "My upload");
    await user.type(screen.getByLabelText(/^description$/i), "A description");
    const video = new File(["x"], "clip.mp4", { type: "video/mp4" });
    const thumb = new File(["x"], "t.png", { type: "image/png" });
    await user.upload(screen.getByLabelText(/^video file$/i), video);
    await user.upload(screen.getByLabelText(/^thumbnail$/i), thumb);
    await user.click(screen.getByRole("button", { name: /publish video/i }));
    await waitFor(() => expect(videosApi.publish).toHaveBeenCalled());
    const body = vi.mocked(videosApi.publish).mock.calls[0][0] as FormData;
    expect(body.get("title")).toBe("My upload");
    expect(body.get("description")).toBe("A description");
    expect(body.get("videoFile")).toBeTruthy();
    expect(body.get("thumbnail")).toBeTruthy();
    expect(await screen.findByText("Watch")).toBeInTheDocument();
  });

  it("shows API error and retry", async () => {
    vi.mocked(videosApi.publish).mockRejectedValue(
      new AppApiError({ message: "too big", status: 400 })
    );
    const user = userEvent.setup();
    withProviders(<UploadPage />);
    await user.type(screen.getByLabelText(/^title$/i), "My upload");
    await user.type(screen.getByLabelText(/^description$/i), "A description");
    await user.upload(
      screen.getByLabelText(/^video file$/i),
      new File(["x"], "clip.mp4", { type: "video/mp4" })
    );
    await user.upload(
      screen.getByLabelText(/^thumbnail$/i),
      new File(["x"], "t.png", { type: "image/png" })
    );
    await user.click(screen.getByRole("button", { name: /publish video/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/too big/i);
    expect(screen.getByRole("button", { name: /^retry$/i })).toBeInTheDocument();
  });
});

describe("video management", () => {
  it("lists videos and confirms delete", async () => {
    vi.mocked(dashboardApi.videos).mockResolvedValue(page([videoFixture]));
    vi.mocked(videosApi.remove).mockResolvedValue({});
    const user = userEvent.setup();
    withProviders(<MyVideosPage />);
    expect(await screen.findByText("Studio clip")).toBeInTheDocument();
    await user.click(await screen.findByRole("button", { name: /^delete$/i }));
    expect(screen.getByText("Delete this video?")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^delete video$/i }));
    await waitFor(() => expect(videosApi.remove).toHaveBeenCalledWith("v1"));
  });

  it("edits a video", async () => {
    vi.mocked(dashboardApi.videos).mockResolvedValue(page([videoFixture]));
    vi.mocked(videosApi.update).mockResolvedValue({
      ...videoFixture,
      title: "Renamed",
    });
    const user = userEvent.setup();
    withProviders(<MyVideosPage />);
    await user.click(await screen.findByRole("button", { name: /^edit$/i }));
    const title = screen.getByLabelText(/^title$/i);
    await user.clear(title);
    await user.type(title, "Renamed");
    await user.click(screen.getByRole("button", { name: /^save$/i }));
    await waitFor(() => expect(videosApi.update).toHaveBeenCalled());
  });

  it("toggles publish", async () => {
    vi.mocked(dashboardApi.videos).mockResolvedValue(page([videoFixture]));
    vi.mocked(videosApi.togglePublish).mockResolvedValue({
      ...videoFixture,
      isPublished: false,
    });
    const user = userEvent.setup();
    withProviders(<MyVideosPage />);
    await user.click(await screen.findByRole("button", { name: /^unpublish$/i }));
    await waitFor(() => expect(videosApi.togglePublish).toHaveBeenCalledWith("v1"));
  });

  it("shows unauthorized delete error", async () => {
    vi.mocked(dashboardApi.videos).mockResolvedValue(page([videoFixture]));
    vi.mocked(videosApi.remove).mockRejectedValue(
      new AppApiError({ message: "no", status: 403 })
    );
    const user = userEvent.setup();
    withProviders(<MyVideosPage />);
    await user.click(await screen.findByRole("button", { name: /^delete$/i }));
    await user.click(await screen.findByRole("button", { name: /^delete video$/i }));
    expect(await screen.findByText(/permission/i)).toBeInTheDocument();
  });
});

describe("playlists", () => {
  it("creates a playlist", async () => {
    vi.mocked(playlistsApi.byUser).mockResolvedValue([]);
    vi.mocked(playlistsApi.create).mockResolvedValue({
      _id: "p1",
      name: "Later",
      description: "Save for later",
      videos: [],
      owner: userFixture._id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    const user = userEvent.setup();
    withProviders(
      <Routes>
        <Route path="/playlists" element={<PlaylistsPage />} />
        <Route path="/playlist/:playlistId" element={<p>Detail</p>} />
      </Routes>,
      "/playlists"
    );
    expect(await screen.findByText("No playlists yet")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^new playlist$/i }));
    await user.type(screen.getByLabelText(/^name$/i), "Later");
    await user.type(screen.getByLabelText(/^description$/i), "Save for later");
    await user.click(screen.getByRole("button", { name: /^create$/i }));
    await waitFor(() =>
      expect(playlistsApi.create).toHaveBeenCalledWith({
        name: "Later",
        description: "Save for later",
      })
    );
  });

  it("loads playlist detail and empty state", async () => {
    vi.mocked(playlistsApi.getById).mockResolvedValue({
      _id: "p1",
      name: "Later",
      description: "Save for later",
      videos: [],
      owner: {
        _id: userFixture._id,
        username: userFixture.username,
        fullname: userFixture.fullname,
        avatar: userFixture.avatar,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    vi.mocked(dashboardApi.videos).mockResolvedValue(page([]));
    withProviders(
      <Routes>
        <Route path="/playlist/:playlistId" element={<PlaylistDetailPage />} />
      </Routes>,
      "/playlist/p1"
    );
    expect(await screen.findByText("This playlist is empty")).toBeInTheDocument();
  });
});

describe("history", () => {
  it("shows empty history", async () => {
    vi.mocked(authApi.history).mockResolvedValue([]);
    withProviders(<HistoryPage />);
    expect(await screen.findByText("No history yet")).toBeInTheDocument();
    expect(screen.getByText(/read-only/i)).toBeInTheDocument();
  });

  it("lists watched videos", async () => {
    vi.mocked(authApi.history).mockResolvedValue([
      { ...videoFixture, owner: { ...userFixture, username: "ada" } },
    ]);
    withProviders(<HistoryPage />);
    expect(await screen.findByText("Studio clip")).toBeInTheDocument();
  });
});

describe("subscriptions feed", () => {
  it("explains how to subscribe when empty", async () => {
    vi.mocked(subscriptionsApi.subscribedChannels).mockResolvedValue({
      channels: [],
      subscribedCount: 0,
    });
    withProviders(<SubscriptionsPage />);
    expect(
      await screen.findByText("You are not subscribed to anyone")
    ).toBeInTheDocument();
  });

  it("loads videos from subscribed channels", async () => {
    vi.mocked(subscriptionsApi.subscribedChannels).mockResolvedValue({
      channels: [
        {
          _id: "u2",
          username: "grace",
          fullname: "Grace Hopper",
          avatar: "https://example.com/g.png",
        },
      ],
      subscribedCount: 1,
    });
    vi.mocked(videosApi.list).mockResolvedValue(page([videoFixture]));
    withProviders(<SubscriptionsPage />);
    expect(await screen.findByText("Grace Hopper")).toBeInTheDocument();
    expect(await screen.findByText("Studio clip")).toBeInTheDocument();
  });
});

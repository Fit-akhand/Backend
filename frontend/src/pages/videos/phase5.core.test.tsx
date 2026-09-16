import type { ReactElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastProvider } from "@/components/ui/Toast";
import { AppApiError } from "@/lib/apiError";
import { useAuthStore } from "@/store/authStore";
import { HomePage } from "@/pages/home/HomePage";
import { WatchPage } from "@/pages/videos/WatchPage";
import { ChannelPage } from "@/pages/channel/ChannelPage";
import { videosApi } from "@/services/api/videos";
import { likesApi } from "@/services/api/likes";
import { commentsApi } from "@/services/api/comments";
import { channelsApi } from "@/services/api/channels";
import { subscriptionsApi } from "@/services/api/subscriptions";

vi.mock("@/services/api/videos", () => ({
  videosApi: {
    list: vi.fn(),
    getById: vi.fn(),
  },
}));

vi.mock("@/services/api/likes", () => ({
  likesApi: {
    toggleVideo: vi.fn(),
    likedVideos: vi.fn(),
  },
}));

vi.mock("@/services/api/comments", () => ({
  commentsApi: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));

vi.mock("@/services/api/channels", () => ({
  channelsApi: {
    byUsername: vi.fn(),
  },
}));

vi.mock("@/services/api/playlists", () => ({
  playlistsApi: {
    byUser: vi.fn().mockResolvedValue([]),
    create: vi.fn(),
    getById: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    addVideo: vi.fn(),
    removeVideo: vi.fn(),
  },
}));

vi.mock("@/services/api/subscriptions", () => ({
  subscriptionsApi: {
    toggle: vi.fn(),
    subscribers: vi.fn(),
  },
}));

const userFixture = {
  _id: "u1",
  username: "ada",
  email: "ada@example.com",
  fullname: "Ada Lovelace",
  avatar: "https://example.com/a.png",
};

const owner = {
  _id: "u2",
  username: "grace",
  fullname: "Grace Hopper",
  avatar: "https://example.com/g.png",
};

const videoFixture = {
  _id: "v1",
  videoFile: "https://example.com/v.mp4",
  thumbnail: "https://example.com/t.jpg",
  owner,
  title: "Hello Tube",
  description: "A real video description",
  duration: 125,
  views: 42,
  isPublished: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const emptyPage = {
  results: [] as typeof videoFixture[],
  page: 1,
  limit: 12,
  total: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPreviousPage: false,
};

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

describe("Home feed", () => {
  it("shows loading then videos", async () => {
    vi.mocked(videosApi.list).mockResolvedValue({
      ...emptyPage,
      results: [videoFixture],
      total: 1,
      totalPages: 1,
    });
    withProviders(
      <Routes>
        <Route path="/" element={<HomePage />} />
      </Routes>
    );
    expect(await screen.findByText("Hello Tube")).toBeInTheDocument();
    expect(videosApi.list).toHaveBeenCalled();
  });

  it("shows empty state", async () => {
    vi.mocked(videosApi.list).mockResolvedValue(emptyPage);
    withProviders(
      <Routes>
        <Route path="/" element={<HomePage />} />
      </Routes>
    );
    expect(await screen.findByText("No videos yet")).toBeInTheDocument();
  });

  it("shows error state with retry", async () => {
    vi.mocked(videosApi.list).mockRejectedValue(
      new AppApiError({ message: "down", status: 0, code: "NETWORK_ERROR" })
    );
    withProviders(
      <Routes>
        <Route path="/" element={<HomePage />} />
      </Routes>
    );
    expect(await screen.findByText(/Cannot reach the API/i)).toBeInTheDocument();
  });

  it("searches via query param", async () => {
    vi.mocked(videosApi.list).mockResolvedValue(emptyPage);
    withProviders(
      <Routes>
        <Route path="/" element={<HomePage />} />
      </Routes>,
      "/?q=hello"
    );
    await waitFor(() => {
      expect(videosApi.list).toHaveBeenCalledWith(
        expect.objectContaining({ query: "hello" })
      );
    });
    expect(await screen.findByText("No matching videos")).toBeInTheDocument();
  });
});

describe("Watch page", () => {
  it("loads video details and player", async () => {
    vi.mocked(videosApi.getById).mockResolvedValue(videoFixture);
    vi.mocked(likesApi.likedVideos).mockResolvedValue(emptyPage);
    vi.mocked(commentsApi.list).mockResolvedValue({
      ...emptyPage,
      results: [],
    });
    vi.mocked(channelsApi.byUsername).mockResolvedValue({
      _id: owner._id,
      username: owner.username,
      fullname: owner.fullname,
      avatar: owner.avatar,
      subscriberCount: 3,
      channelsubscribedToCount: 1,
      isSubscribed: false,
    });
    withProviders(
      <Routes>
        <Route path="/watch/:videoId" element={<WatchPage />} />
      </Routes>,
      "/watch/v1"
    );
    expect(await screen.findByText("Hello Tube")).toBeInTheDocument();
    expect(screen.getByLabelText("Hello Tube")).toBeInTheDocument();
  });

  it("shows not found", async () => {
    vi.mocked(videosApi.getById).mockRejectedValue(
      new AppApiError({ message: "missing", status: 404, code: "NOT_FOUND" })
    );
    withProviders(
      <Routes>
        <Route path="/watch/:videoId" element={<WatchPage />} />
      </Routes>,
      "/watch/missing"
    );
    expect(await screen.findByText("Video not found")).toBeInTheDocument();
  });

  it("toggles like", async () => {
    vi.mocked(videosApi.getById).mockResolvedValue(videoFixture);
    vi.mocked(likesApi.likedVideos).mockResolvedValue(emptyPage);
    vi.mocked(likesApi.toggleVideo).mockResolvedValue({ liked: true, likes: 1 });
    vi.mocked(commentsApi.list).mockResolvedValue({ ...emptyPage, results: [] });
    vi.mocked(channelsApi.byUsername).mockResolvedValue({
      _id: owner._id,
      username: owner.username,
      fullname: owner.fullname,
      avatar: owner.avatar,
      subscriberCount: 3,
      channelsubscribedToCount: 1,
      isSubscribed: false,
    });
    const user = userEvent.setup();
    withProviders(
      <Routes>
        <Route path="/watch/:videoId" element={<WatchPage />} />
      </Routes>,
      "/watch/v1"
    );
    const like = await screen.findByRole("button", { name: /like video/i });
    await user.click(like);
    await waitFor(() => {
      expect(likesApi.toggleVideo).toHaveBeenCalledWith("v1");
    });
  });

  it("toggles subscribe", async () => {
    vi.mocked(videosApi.getById).mockResolvedValue(videoFixture);
    vi.mocked(likesApi.likedVideos).mockResolvedValue(emptyPage);
    vi.mocked(commentsApi.list).mockResolvedValue({ ...emptyPage, results: [] });
    vi.mocked(channelsApi.byUsername).mockResolvedValue({
      _id: owner._id,
      username: owner.username,
      fullname: owner.fullname,
      avatar: owner.avatar,
      subscriberCount: 3,
      channelsubscribedToCount: 1,
      isSubscribed: false,
    });
    vi.mocked(subscriptionsApi.toggle).mockResolvedValue({ subscribed: true });
    const user = userEvent.setup();
    withProviders(
      <Routes>
        <Route path="/watch/:videoId" element={<WatchPage />} />
      </Routes>,
      "/watch/v1"
    );
    const btn = await screen.findByRole("button", { name: /^subscribe$/i });
    await user.click(btn);
    await waitFor(() => {
      expect(subscriptionsApi.toggle).toHaveBeenCalledWith(owner._id);
    });
  });
});

describe("Channel page", () => {
  it("renders profile and videos", async () => {
    vi.mocked(channelsApi.byUsername).mockResolvedValue({
      _id: owner._id,
      username: owner.username,
      fullname: owner.fullname,
      avatar: owner.avatar,
      coverImage: "https://example.com/c.jpg",
      subscriberCount: 9,
      channelsubscribedToCount: 2,
      isSubscribed: false,
    });
    vi.mocked(videosApi.list).mockResolvedValue({
      ...emptyPage,
      results: [videoFixture],
      total: 1,
      totalPages: 1,
    });
    withProviders(
      <Routes>
        <Route path="/channel/:username" element={<ChannelPage />} />
      </Routes>,
      "/channel/grace"
    );
    expect(await screen.findByText("Grace Hopper")).toBeInTheDocument();
    expect(await screen.findByText("Hello Tube")).toBeInTheDocument();
    expect(screen.queryByText(/@example.com/i)).not.toBeInTheDocument();
  });

  it("subscribes from channel page", async () => {
    vi.mocked(channelsApi.byUsername).mockResolvedValue({
      _id: owner._id,
      username: owner.username,
      fullname: owner.fullname,
      avatar: owner.avatar,
      subscriberCount: 9,
      channelsubscribedToCount: 2,
      isSubscribed: false,
    });
    vi.mocked(videosApi.list).mockResolvedValue(emptyPage);
    vi.mocked(subscriptionsApi.toggle).mockResolvedValue({ subscribed: true });
    const user = userEvent.setup();
    withProviders(
      <Routes>
        <Route path="/channel/:username" element={<ChannelPage />} />
      </Routes>,
      "/channel/grace"
    );
    await user.click(await screen.findByRole("button", { name: /^subscribe$/i }));
    await waitFor(() => {
      expect(subscriptionsApi.toggle).toHaveBeenCalledWith(owner._id);
    });
  });
});

describe("Comments", () => {
  it("lists and creates comments", async () => {
    vi.mocked(videosApi.getById).mockResolvedValue(videoFixture);
    vi.mocked(likesApi.likedVideos).mockResolvedValue(emptyPage);
    vi.mocked(channelsApi.byUsername).mockResolvedValue({
      _id: owner._id,
      username: owner.username,
      fullname: owner.fullname,
      avatar: owner.avatar,
      subscriberCount: 1,
      channelsubscribedToCount: 0,
      isSubscribed: false,
    });
    vi.mocked(commentsApi.list).mockResolvedValue({
      ...emptyPage,
      results: [
        {
          _id: "c1",
          content: "Nice video",
          video: "v1",
          owner,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      total: 1,
      totalPages: 1,
    });
    vi.mocked(commentsApi.create).mockResolvedValue({
      _id: "c2",
      content: "Thanks",
      video: "v1",
      owner: userFixture,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    const user = userEvent.setup();
    withProviders(
      <Routes>
        <Route path="/watch/:videoId" element={<WatchPage />} />
      </Routes>,
      "/watch/v1"
    );
    expect(await screen.findByText("Nice video")).toBeInTheDocument();
    await user.type(screen.getByLabelText(/add a comment/i), "Thanks");
    await user.click(screen.getByRole("button", { name: /^comment$/i }));
    await waitFor(() => {
      expect(commentsApi.create).toHaveBeenCalledWith("v1", "Thanks");
    });
  });

  it("edits and deletes own comment", async () => {
    const ownComment = {
      _id: "c1",
      content: "Mine",
      video: "v1",
      owner: userFixture,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    vi.mocked(videosApi.getById).mockResolvedValue(videoFixture);
    vi.mocked(likesApi.likedVideos).mockResolvedValue(emptyPage);
    vi.mocked(channelsApi.byUsername).mockResolvedValue({
      _id: owner._id,
      username: owner.username,
      fullname: owner.fullname,
      avatar: owner.avatar,
      subscriberCount: 1,
      channelsubscribedToCount: 0,
      isSubscribed: false,
    });
    vi.mocked(commentsApi.list).mockResolvedValue({
      ...emptyPage,
      results: [ownComment],
      total: 1,
      totalPages: 1,
    });
    vi.mocked(commentsApi.update).mockResolvedValue({
      ...ownComment,
      content: "Updated",
    });
    vi.mocked(commentsApi.remove).mockResolvedValue({});
    const user = userEvent.setup();
    withProviders(
      <Routes>
        <Route path="/watch/:videoId" element={<WatchPage />} />
      </Routes>,
      "/watch/v1"
    );
    expect(await screen.findByText("Mine")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^edit$/i }));
    const editBox = screen.getByLabelText(/edit comment/i);
    await user.clear(editBox);
    await user.type(editBox, "Updated");
    await user.click(screen.getByRole("button", { name: /^save$/i }));
    await waitFor(() => {
      expect(commentsApi.update).toHaveBeenCalledWith("c1", "Updated");
    });
    await user.click(screen.getByRole("button", { name: /^delete$/i }));
    await waitFor(() => {
      expect(commentsApi.remove).toHaveBeenCalledWith("c1");
    });
  });
});

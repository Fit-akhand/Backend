import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { GuestRoute, ProtectedRoute } from "@/components/common/RouteGuards";
import { HomePage } from "@/pages/home/HomePage";
import { useAuthBootstrap } from "@/hooks/useAuthBootstrap";
import { Spinner } from "@/components/ui/Spinner";

const LoginPage = lazy(() =>
  import("@/pages/auth/LoginPage").then((m) => ({ default: m.LoginPage }))
);
const RegisterPage = lazy(() =>
  import("@/pages/auth/RegisterPage").then((m) => ({ default: m.RegisterPage }))
);
const SettingsPage = lazy(() =>
  import("@/pages/settings/SettingsPage").then((m) => ({ default: m.SettingsPage }))
);
const NotFoundPage = lazy(() =>
  import("@/pages/NotFoundPage").then((m) => ({ default: m.NotFoundPage }))
);
const WatchPage = lazy(() =>
  import("@/pages/videos/WatchPage").then((m) => ({ default: m.WatchPage }))
);
const ChannelPage = lazy(() =>
  import("@/pages/channel/ChannelPage").then((m) => ({ default: m.ChannelPage }))
);
const DashboardPage = lazy(() =>
  import("@/pages/studio/DashboardPage").then((m) => ({ default: m.DashboardPage }))
);
const UploadPage = lazy(() =>
  import("@/pages/studio/UploadPage").then((m) => ({ default: m.UploadPage }))
);
const MyVideosPage = lazy(() =>
  import("@/pages/studio/MyVideosPage").then((m) => ({ default: m.MyVideosPage }))
);
const PlaylistsPage = lazy(() =>
  import("@/pages/playlists/PlaylistsPage").then((m) => ({ default: m.PlaylistsPage }))
);
const PlaylistDetailPage = lazy(() =>
  import("@/pages/playlists/PlaylistDetailPage").then((m) => ({
    default: m.PlaylistDetailPage,
  }))
);
const HistoryPage = lazy(() =>
  import("@/pages/history/HistoryPage").then((m) => ({ default: m.HistoryPage }))
);
const SubscriptionsPage = lazy(() =>
  import("@/pages/subscriptions/SubscriptionsPage").then((m) => ({
    default: m.SubscriptionsPage,
  }))
);
const SearchPage = lazy(() =>
  import("@/pages/search/SearchPage").then((m) => ({ default: m.SearchPage }))
);

export const AppRouter = () => {
  const status = useAuthBootstrap();

  if (status === "loading") {
    return <Spinner label="Loading Vidzora" />;
  }

  return (
    <Suspense fallback={<Spinner label="Loading page" />}>
      <Routes>
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        <Route element={<AppShell />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/watch/:videoId" element={<WatchPage />} />
          <Route path="/channel/:username" element={<ChannelPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path="/channel/id/:userId" element={<Navigate to="/" replace />} />
            <Route path="/playlist/:playlistId" element={<PlaylistDetailPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/subscriptions" element={<SubscriptionsPage />} />
            <Route path="/playlists" element={<PlaylistsPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/studio/upload" element={<UploadPage />} />
            <Route path="/studio/videos" element={<MyVideosPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>

        <Route path="/home" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
};

import { Link, useNavigate } from "react-router-dom";
import {
  useDashboardStats,
  useDashboardVideos,
} from "@/features/videos/hooks";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { toUserMessage } from "@/lib/apiError";
import { formatViews, formatRelativeDate } from "@/lib/format";
import { useAuthStore } from "@/store/authStore";

export const DashboardPage = () => {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const stats = useDashboardStats();
  const recent = useDashboardVideos(1, 8);

  if (stats.isLoading) {
    return (
      <div className="grid gap-4">
        <Skeleton className="h-10 w-56" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  if (stats.isError) {
    return (
      <ErrorState
        title="Could not load studio"
        message={toUserMessage(stats.error)}
        onRetry={() => void stats.refetch()}
      />
    );
  }

  const data = stats.data;
  const videos = recent.data?.results ?? [];
  const published = videos.filter((v) => v.isPublished).length;
  const unpublished = videos.filter((v) => !v.isPublished).length;
  const truncated = (recent.data?.total ?? 0) > videos.length;

  return (
    <div className="grid gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-accent">Creator Studio</p>
          <h1 className="font-display text-3xl">Welcome back{user?.fullname ? `, ${user.fullname.split(" ")[0]}` : ""}</h1>
          <p className="mt-1 text-muted">
            Stats come from your Vidzora account — not estimates.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/studio/upload">
            <Button>Upload video</Button>
          </Link>
          <Link to="/studio/videos">
            <Button variant="secondary">My videos</Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Stat label="Videos" value={String(data?.totalVideos ?? 0)} />
        <Stat label="Views" value={formatViews(data?.totalViews ?? 0)} />
        <Stat label="Likes" value={formatViews(data?.totalLikes ?? 0)} />
        <Stat label="Comments" value={formatViews(data?.totalComments ?? 0)} />
        <Stat label="Subscribers" value={formatViews(data?.totalSubscribers ?? 0)} />
      </div>

      <Card className="p-4">
        <p className="text-sm text-muted">
          Published / unpublished counts below are from your latest {videos.length} studio
          videos{truncated ? ` (of ${recent.data?.total})` : ""}. Totals use{" "}
          <code>GET /dashboard/stats</code>.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge>{published} published (loaded)</Badge>
          <Badge>{unpublished} unpublished (loaded)</Badge>
        </div>
      </Card>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="font-display text-2xl">Recent videos</h2>
          <Link className="text-sm text-accent underline" to="/studio/videos">
            Manage all
          </Link>
        </div>
        {recent.isLoading ? <Skeleton className="h-40" /> : null}
        {recent.isError ? (
          <ErrorState
            message={toUserMessage(recent.error)}
            onRetry={() => void recent.refetch()}
          />
        ) : null}
        {recent.data && recent.data.results.length === 0 ? (
          <EmptyState
            title="No videos yet"
            description="Upload a video and thumbnail to publish on Vidzora."
            actionLabel="Upload"
            onAction={() => navigate("/studio/upload")}
          />
        ) : null}
        {videos.length > 0 ? (
          <ul className="grid gap-2">
            {videos.map((video) => (
              <li
                key={video._id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-surface px-3 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{video.title}</p>
                  <p className="text-sm text-muted">
                    {formatViews(video.views)} views
                    {video.createdAt ? ` · ${formatRelativeDate(video.createdAt)}` : ""}
                  </p>
                </div>
                <span className="text-xs text-muted">
                  {video.isPublished ? "Published" : "Unpublished"}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <LinkCard to="/playlists" title="Playlists" body="Create and organize collections." />
        <LinkCard to="/settings" title="Channel" body="Update name, email, avatar, and cover." />
        <LinkCard
          to={user ? `/channel/${encodeURIComponent(user.username)}` : "/"}
          title="Public channel"
          body="See your channel the way subscribers do."
        />
      </section>
    </div>
  );
};

const Stat = ({ label, value }: { label: string; value: string }) => (
  <Card className="p-4">
    <p className="text-sm text-muted">{label}</p>
    <p className="mt-1 font-display text-3xl">{value}</p>
  </Card>
);

const LinkCard = ({ to, title, body }: { to: string; title: string; body: string }) => (
  <Link
    to={to}
    className="rounded-xl border border-line bg-surface p-4 transition hover:border-accent"
  >
    <p className="font-medium">{title}</p>
    <p className="mt-1 text-sm text-muted">{body}</p>
  </Link>
);

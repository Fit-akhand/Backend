import { Link } from "react-router-dom";
import { useSubscriptionsFeed } from "@/features/subscriptions/hooks";
import { useAuthStore } from "@/store/authStore";
import { VideoGrid } from "@/components/video/VideoGrid";
import { Avatar } from "@/components/ui/Avatar";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { toUserMessage } from "@/lib/apiError";

export const SubscriptionsPage = () => {
  const user = useAuthStore((s) => s.user);
  const { channelsQuery, feedQuery } = useSubscriptionsFeed(user?._id);

  if (channelsQuery.isLoading) return <Skeleton className="h-64" />;
  if (channelsQuery.isError) {
    return (
      <ErrorState
        title="Could not load subscriptions"
        message={toUserMessage(channelsQuery.error)}
        onRetry={() => void channelsQuery.refetch()}
      />
    );
  }

  const channels = (channelsQuery.data?.channels ?? []).filter(Boolean);
  if (channels.length === 0) {
    return (
      <div className="grid gap-4">
        <h1 className="font-display text-3xl">Subscriptions</h1>
        <EmptyState
          title="You are not subscribed to anyone"
          description="Open a channel and tap Subscribe. New videos from those channels will appear here."
        />
      </div>
    );
  }

  return (
    <div className="grid gap-8">
      <div>
        <h1 className="font-display text-3xl">Subscriptions</h1>
        <p className="mt-1 text-muted">
          Channels from GET /subscriptions/u/:id. Videos are loaded per channel because
          the API has no combined subscription feed.
        </p>
      </div>

      <ul className="flex gap-4 overflow-x-auto pb-2">
        {channels.map((channel) => (
          <li key={channel._id} className="shrink-0">
            <Link
              to={`/channel/${encodeURIComponent(channel.username)}`}
              className="grid w-20 place-items-center gap-1 text-center"
            >
              <Avatar src={channel.avatar} alt="" size="lg" />
              <span className="line-clamp-2 text-xs">{channel.fullname}</span>
            </Link>
          </li>
        ))}
      </ul>

      {feedQuery.isLoading ? <Skeleton className="h-48" /> : null}
      {feedQuery.isError ? (
        <ErrorState
          message={toUserMessage(feedQuery.error)}
          onRetry={() => void feedQuery.refetch()}
        />
      ) : null}
      {feedQuery.data && feedQuery.data.length === 0 ? (
        <EmptyState
          title="No recent videos"
          description="Your subscribed channels have not published videos yet."
        />
      ) : null}
      {feedQuery.data && feedQuery.data.length > 0 ? (
        <VideoGrid videos={feedQuery.data} />
      ) : null}
    </div>
  );
};

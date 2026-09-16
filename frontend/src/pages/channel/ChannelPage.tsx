import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  useChannel,
  useChannelVideos,
} from "@/features/subscriptions/hooks";
import { SubscribeButton } from "@/components/video/SubscribeButton";
import { VideoFeed } from "@/components/video/VideoFeed";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { AppApiError, toUserMessage } from "@/lib/apiError";
import { useAuthStore } from "@/store/authStore";
import { formatViews } from "@/lib/format";

export const ChannelPage = () => {
  const { username: raw } = useParams<{ username: string }>();
  const username = raw ? decodeURIComponent(raw) : undefined;
  const currentUser = useAuthStore((s) => s.user);
  const [params, setParams] = useSearchParams();
  const page = Number(params.get("page") || "1");
  const channel = useChannel(username);

  if (channel.isLoading) {
    return (
      <div>
        <Skeleton className="h-36 w-full rounded-xl" />
        <div className="mt-4 flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <Skeleton className="h-8 w-48" />
        </div>
      </div>
    );
  }

  if (channel.isError) {
    const notFound =
      channel.error instanceof AppApiError &&
      (channel.error.status === 404 || channel.error.status === 400);
    return (
      <ErrorState
        title={notFound ? "Channel not found" : "Could not load channel"}
        message={toUserMessage(channel.error)}
        onRetry={notFound ? undefined : () => void channel.refetch()}
      />
    );
  }

  const profile = channel.data;
  if (!profile || !username) {
    return (
      <ErrorState
        title="Channel not found"
        message="That channel does not exist."
      />
    );
  }

  const isOwn = currentUser?._id === profile._id;

  return (
    <div>
      <div className="overflow-hidden rounded-xl bg-line">
        {profile.coverImage ? (
          <img
            src={profile.coverImage}
            alt=""
            className="h-36 w-full object-cover md:h-48"
          />
        ) : (
          <div className="h-36 bg-gradient-to-r from-line to-surface md:h-48" />
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar src={profile.avatar} alt={profile.fullname} size="lg" />
          <div>
            <h1 className="font-display text-3xl">{profile.fullname}</h1>
            <p className="text-muted">@{profile.username}</p>
            <p className="text-sm text-muted">
              {formatViews(profile.subscriberCount)} subscribers
              {" · "}
              {profile.channelsubscribedToCount} subscribed
            </p>
          </div>
        </div>
        {isOwn ? (
          <div className="flex flex-wrap gap-2">
            <Link to="/settings">
              <Button variant="secondary">Edit channel</Button>
            </Link>
            <Link to="/dashboard">
              <Button>Studio</Button>
            </Link>
          </div>
        ) : (
          <SubscribeButton
            channelId={profile._id}
            username={profile.username}
            isSubscribed={profile.isSubscribed}
            isOwnChannel={isOwn}
          />
        )}
      </div>

      <div className="mt-8">
        <ChannelVideos
          userId={profile._id}
          page={page}
          onPage={(next) => {
            const copy = new URLSearchParams(params);
            copy.set("page", String(next));
            setParams(copy);
          }}
        />
      </div>
    </div>
  );
};

const ChannelVideos = ({
  userId,
  page,
  onPage,
}: {
  userId: string;
  page: number;
  onPage: (page: number) => void;
}) => {
  const videos = useChannelVideos(userId, page);
  return (
    <VideoFeed
      query={videos}
      title={<h2 className="mb-4 font-display text-2xl">Videos</h2>}
      emptyTitle="No videos yet"
      emptyDescription="This channel has not published any videos."
      onPage={onPage}
    />
  );
};

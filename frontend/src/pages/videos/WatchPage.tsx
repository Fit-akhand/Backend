import { Link, useParams } from "react-router-dom";
import { useVideo } from "@/features/videos/hooks";
import { useChannel } from "@/features/subscriptions/hooks";
import { VideoPlayer } from "@/components/video/VideoPlayer";
import { ExpandableDescription } from "@/components/video/ExpandableDescription";
import { LikeButton } from "@/components/video/LikeButton";
import { SaveToPlaylistButton } from "@/components/video/SaveToPlaylistButton";
import { SubscribeButton } from "@/components/video/SubscribeButton";
import { CommentsSection } from "@/components/comment/CommentsSection";
import { Avatar } from "@/components/ui/Avatar";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { AppApiError, toUserMessage } from "@/lib/apiError";
import { formatRelativeDate, formatViews, ownerId } from "@/lib/format";
import { RelatedVideos } from "@/components/video/RelatedVideos";

export const WatchPage = () => {
  const { videoId } = useParams<{ videoId: string }>();
  const currentUser = useAuthStore((s) => s.user);
  const videoQuery = useVideo(videoId);

  if (videoQuery.isLoading) {
    return (
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div>
          <Skeleton className="aspect-video w-full" />
          <Skeleton className="mt-4 h-8 w-2/3" />
          <Skeleton className="mt-3 h-12 w-full" />
        </div>
      </div>
    );
  }

  if (videoQuery.isError) {
    const notFound =
      videoQuery.error instanceof AppApiError && videoQuery.error.status === 404;
    return (
      <ErrorState
        title={notFound ? "Video not found" : "Could not load video"}
        message={toUserMessage(videoQuery.error)}
        onRetry={notFound ? undefined : () => void videoQuery.refetch()}
      />
    );
  }

  const video = videoQuery.data;
  if (!video || !videoId) {
    return (
      <ErrorState title="Video not found" message="That video does not exist." />
    );
  }

  const owner =
    video.owner && typeof video.owner === "object"
      ? (video.owner as VideoOwner)
      : null;
  const channelId = ownerId(video.owner);

  return (
    <WatchBody
      videoId={videoId}
      video={video}
      owner={owner}
      channelId={channelId}
      currentUserId={currentUser?._id}
    />
  );
};

const WatchBody = ({
  videoId,
  video,
  owner,
  channelId,
  currentUserId,
}: {
  videoId: string;
  video: import("@/types/api").Video;
  owner: VideoOwner | null;
  channelId: string | null;
  currentUserId?: string;
}) => {
  const channel = useChannel(owner?.username);
  const isOwn =
    Boolean(currentUserId && channelId && currentUserId === channelId);

  return (
    <div className="mx-auto max-w-6xl">
      <VideoPlayer
        src={video.videoFile}
        poster={video.thumbnail}
        title={video.title}
      />
      <h1 className="mt-4 font-display text-2xl md:text-3xl">{video.title}</h1>
      <p className="mt-1 text-sm text-muted">
        {formatViews(video.views)} views
        {video.createdAt ? ` · ${formatRelativeDate(video.createdAt)}` : ""}
      </p>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
        <div className="flex min-w-0 items-center gap-3">
          {owner ? (
            <Link
              to={`/channel/${encodeURIComponent(owner.username)}`}
              className="flex min-w-0 items-center gap-3"
            >
              <Avatar src={owner.avatar} alt={owner.fullname} />
              <div className="min-w-0">
                <p className="truncate font-medium">{owner.fullname}</p>
                <p className="text-sm text-muted">
                  {channel.data
                    ? `${channel.data.subscriberCount} subscribers`
                    : `@${owner.username}`}
                </p>
              </div>
            </Link>
          ) : null}
          {channelId && owner ? (
            <SubscribeButton
              channelId={channelId}
              username={owner.username}
              isSubscribed={channel.data?.isSubscribed ?? false}
              isOwnChannel={isOwn}
            />
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <SaveToPlaylistButton videoId={videoId} />
          <LikeButton videoId={videoId} />
        </div>
      </div>

      <div className="mt-4">
        <ExpandableDescription text={video.description} />
      </div>

      <CommentsSection videoId={videoId} />
    </div>
  );
};

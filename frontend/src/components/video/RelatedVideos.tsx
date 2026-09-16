import { useVideos } from "@/features/videos/hooks";
import { VideoCard } from "@/components/video/VideoCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { toUserMessage } from "@/lib/apiError";

export const RelatedVideos = ({
  userId,
  currentVideoId,
}: {
  userId?: string;
  currentVideoId: string;
}) => {
  const related = useVideos({
    userId,
    page: 1,
    limit: 8,
    sortBy: "createdAt",
    sortType: "desc",
  });

  if (!userId) return null;

  if (related.isLoading) {
    return (
      <aside aria-label="More from this channel">
        <h2 className="mb-3 font-display text-xl">More from this channel</h2>
        <div className="grid gap-4">
          <Skeleton className="aspect-video w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </aside>
    );
  }

  if (related.isError) {
    return (
      <aside>
        <ErrorState
          title="Could not load related videos"
          message={toUserMessage(related.error)}
          onRetry={() => void related.refetch()}
        />
      </aside>
    );
  }

  const videos = (related.data?.results ?? []).filter((video) => video._id !== currentVideoId);
  if (videos.length === 0) return null;

  return (
    <aside aria-label="More from this channel" className="min-w-0">
      <h2 className="mb-3 font-display text-xl">More from this channel</h2>
      <div className="grid gap-4">
        {videos.map((video) => (
          <VideoCard key={video._id} video={video} />
        ))}
      </div>
    </aside>
  );
};

import { useWatchHistory } from "@/features/history/hooks";
import { VideoGrid } from "@/components/video/VideoGrid";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { toUserMessage } from "@/lib/apiError";

export const HistoryPage = () => {
  const history = useWatchHistory();

  if (history.isLoading) return <Skeleton className="h-64" />;
  if (history.isError) {
    return (
      <ErrorState
        title="Could not load history"
        message={toUserMessage(history.error)}
        onRetry={() => void history.refetch()}
      />
    );
  }

  const videos = history.data ?? [];

  return (
    <div className="grid gap-4">
      <div>
        <h1 className="font-display text-3xl">Watch history</h1>
        <p className="mt-1 text-muted">
          Most recently watched first (up to 50). Vidzora does not expose remove or
          clear-history APIs, so this list is read-only.
        </p>
      </div>
      {videos.length === 0 ? (
        <EmptyState
          title="No history yet"
          description="Open a video to add it to your history. The API writes history on GET /videos/:id."
        />
      ) : (
        <VideoGrid videos={videos} />
      )}
    </div>
  );
};

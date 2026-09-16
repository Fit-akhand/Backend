import type { ReactNode } from "react";
import type { Paginated, Video } from "@/types/api";
import { VideoGrid, VideoGridSkeleton } from "@/components/video/VideoGrid";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Pagination } from "@/components/ui/Pagination";
import { toUserMessage } from "@/lib/apiError";

type FeedQuery = {
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  data?: Paginated<Video>;
  refetch: () => unknown;
};

type Props = {
  query: FeedQuery;
  title?: ReactNode;
  emptyTitle: string;
  emptyDescription: string;
  onPage: (page: number) => void;
  onClearSearch?: () => void;
  showClearSearch?: boolean;
};

export const VideoFeed = ({
  query,
  title,
  emptyTitle,
  emptyDescription,
  onPage,
  onClearSearch,
  showClearSearch,
}: Props) => (
  <div>
    {title}
    {query.isLoading ? <VideoGridSkeleton /> : null}
    {query.isError ? (
      <ErrorState
        message={toUserMessage(query.error)}
        onRetry={() => void query.refetch()}
      />
    ) : null}
    {query.data && query.data.results.length === 0 ? (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        actionLabel={showClearSearch ? "Clear search" : undefined}
        onAction={showClearSearch ? onClearSearch : undefined}
      />
    ) : null}
    {query.data && query.data.results.length > 0 ? (
      <>
        <VideoGrid videos={query.data.results} />
        <Pagination
          page={query.data.page}
          totalPages={query.data.totalPages}
          hasNextPage={query.data.hasNextPage}
          hasPreviousPage={query.data.hasPreviousPage}
          onPage={onPage}
        />
      </>
    ) : null}
  </div>
);

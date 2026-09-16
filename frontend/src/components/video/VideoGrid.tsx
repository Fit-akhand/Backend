import type { Video } from "@/types/api";
import { VideoCard } from "@/components/video/VideoCard";
import { Skeleton } from "@/components/ui/Skeleton";

export const VideoGridSkeleton = ({ count = 6 }: { count?: number }) => (
  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i}>
        <Skeleton className="aspect-video w-full" />
        <Skeleton className="mt-3 h-4 w-3/4" />
        <Skeleton className="mt-2 h-3 w-1/2" />
      </div>
    ))}
  </div>
);

export const VideoGrid = ({ videos }: { videos: Video[] }) => (
  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
    {videos.map((video) => (
      <VideoCard key={video._id} video={video} />
    ))}
  </div>
);

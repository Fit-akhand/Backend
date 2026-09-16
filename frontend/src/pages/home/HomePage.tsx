import { useSearchParams } from "react-router-dom";
import { useVideos } from "@/features/videos/hooks";
import { VideoFeed } from "@/components/video/VideoFeed";
import { Button } from "@/components/ui/Button";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { GuestCatalogIntro } from "./GuestCatalogIntro";

export const HomePage = () => {
  const [params, setParams] = useSearchParams();
  const page = Number(params.get("page") || "1");
  const q = params.get("q") || "";
  const debounced = useDebouncedValue(q.trim(), 350);
  const searchReady = debounced.length === 0 || debounced.length >= 2;

  const videos = useVideos({
    page,
    limit: 12,
    query: searchReady && debounced.length >= 2 ? debounced : undefined,
    sortBy: "createdAt",
    sortType: "desc",
  });

  const setPage = (next: number) => {
    const copy = new URLSearchParams(params);
    copy.set("page", String(next));
    setParams(copy);
  };

  const clearSearch = () => {
    const copy = new URLSearchParams(params);
    copy.delete("q");
    copy.delete("page");
    setParams(copy);
  };

  return (
    <div>
      <GuestCatalogIntro />
      {q && q.trim().length > 0 && q.trim().length < 2 ? (
        <p className="mb-4 text-sm text-muted" role="status">
          Type at least 2 characters to search.
        </p>
      ) : null}
      <VideoFeed
        query={videos}
        title={
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h1 className="font-display text-3xl">
              {debounced.length >= 2
                ? `Results for “${debounced}”`
                : "Latest videos"}
            </h1>
            {debounced.length >= 2 ? (
              <Button variant="secondary" onClick={clearSearch}>
                Clear search
              </Button>
            ) : null}
          </div>
        }
        emptyTitle={
          debounced.length >= 2 ? "No matching videos" : "No videos yet"
        }
        emptyDescription={
          debounced.length >= 2
            ? "Try a different search. Search uses the backend video list query parameter."
            : "When someone publishes a video through the API, it will show up here."
        }
        onPage={setPage}
        showClearSearch={debounced.length >= 2}
        onClearSearch={clearSearch}
      />
    </div>
  );
};

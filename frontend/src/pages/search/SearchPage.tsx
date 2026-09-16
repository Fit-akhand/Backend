import { useSearchParams } from "react-router-dom";
import { useVideos } from "@/features/videos/hooks";
import { VideoFeed } from "@/components/video/VideoFeed";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import type { VideoListQuery } from "@/services/api/videos";

const SORT_FIELDS: VideoListQuery["sortBy"][] = [
  "createdAt",
  "views",
  "title",
  "duration",
];

export const SearchPage = () => {
  const [params, setParams] = useSearchParams();
  const page = Number(params.get("page") || "1");
  const q = params.get("q") || "";
  const sortBy = (SORT_FIELDS.includes(params.get("sortBy") as VideoListQuery["sortBy"])
    ? params.get("sortBy")
    : "createdAt") as NonNullable<VideoListQuery["sortBy"]>;
  const sortType = params.get("sortType") === "asc" ? "asc" : "desc";
  const debounced = useDebouncedValue(q.trim(), 350);
  const searchReady = debounced.length >= 2;

  const videos = useVideos({
    page,
    limit: 12,
    query: searchReady ? debounced : undefined,
    sortBy,
    sortType,
  });

  const update = (patch: Record<string, string | null>) => {
    const copy = new URLSearchParams(params);
    for (const [key, value] of Object.entries(patch)) {
      if (value === null || value === "") copy.delete(key);
      else copy.set(key, value);
    }
    setParams(copy);
  };

  return (
    <div>
      <h1 className="mb-4 font-display text-3xl">Search</h1>
      <form
        className="mb-6 grid gap-3 sm:grid-cols-[minmax(0,1fr)_10rem_8rem_auto]"
        onSubmit={(event) => {
          event.preventDefault();
          const next = String(new FormData(event.currentTarget).get("q") ?? "").trim();
          update({ q: next || null, page: "1" });
        }}
      >
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Query</span>
          <input
            name="q"
            defaultValue={q}
            key={q}
            minLength={2}
            placeholder="Search published videos"
            className="min-h-11 rounded-lg border border-line bg-surface px-3"
          />
        </label>
        <Select
          label="Sort by"
          id="search-sort-by"
          value={sortBy}
          onChange={(event) => update({ sortBy: event.target.value, page: "1" })}
        >
          <option value="createdAt">Newest</option>
          <option value="views">Views</option>
          <option value="title">Title</option>
          <option value="duration">Duration</option>
        </Select>
        <Select
          label="Order"
          id="search-sort-order"
          value={sortType}
          onChange={(event) => update({ sortType: event.target.value, page: "1" })}
        >
          <option value="desc">Descending</option>
          <option value="asc">Ascending</option>
        </Select>
        <div className="flex items-end gap-2">
          <Button type="submit">Search</Button>
          {q ? (
            <Button
              type="button"
              variant="secondary"
              onClick={() => setParams(new URLSearchParams())}
            >
              Clear search
            </Button>
          ) : null}
        </div>
      </form>

      {q.trim().length > 0 && q.trim().length < 2 ? (
        <p className="text-sm text-muted" role="status">
          Type at least 2 characters to search.
        </p>
      ) : null}

      {!searchReady && q.trim().length === 0 ? (
        <p className="text-muted">
          Search uses GET /videos with the API <code>query</code>, <code>sortBy</code>, and{" "}
          <code>sortType</code> parameters.
        </p>
      ) : null}

      {searchReady ? (
        <VideoFeed
          query={videos}
          title={
            <h2 className="mb-4 font-display text-2xl">Results for “{debounced}”</h2>
          }
          emptyTitle="No matching videos"
          emptyDescription="Try a different search. Filtering is server-side only."
          onPage={(next) => update({ page: String(next) })}
          showClearSearch
          onClearSearch={() => setParams(new URLSearchParams())}
        />
      ) : null}
    </div>
  );
};

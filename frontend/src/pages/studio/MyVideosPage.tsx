import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  useDashboardVideos,
  useDeleteVideo,
  useTogglePublish,
  useUpdateVideo,
} from "@/features/videos/hooks";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Badge } from "@/components/ui/Badge";
import { Pagination } from "@/components/ui/Pagination";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { toUserMessage } from "@/lib/apiError";
import { formatRelativeDate, formatViews } from "@/lib/format";
import { useToast } from "@/components/ui/useToast";
import type { Video } from "@/types/api";

export const MyVideosPage = () => {
  const [params, setParams] = useSearchParams();
  const page = Number(params.get("page") || "1");
  const filter = params.get("status") || "all";
  const q = (params.get("q") || "").trim().toLowerCase();
  const videos = useDashboardVideos(page, 12);
  const navigate = useNavigate();
  const toast = useToast();
  const togglePublish = useTogglePublish();
  const remove = useDeleteVideo();
  const update = useUpdateVideo();
  const [edit, setEdit] = useState<Video | null>(null);
  const [del, setDel] = useState<Video | null>(null);

  const filtered = useMemo(() => {
    const list = videos.data?.results ?? [];
    return list.filter((video) => {
      if (filter === "published" && !video.isPublished) return false;
      if (filter === "unpublished" && video.isPublished) return false;
      if (q && !video.title.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [videos.data, filter, q]);

  const setPage = (next: number) => {
    const copy = new URLSearchParams(params);
    copy.set("page", String(next));
    setParams(copy);
  };

  if (videos.isLoading) return <Skeleton className="h-64" />;
  if (videos.isError) {
    return (
      <ErrorState
        title="Could not load videos"
        message={toUserMessage(videos.error)}
        onRetry={() => void videos.refetch()}
      />
    );
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">My videos</h1>
          <p className="text-muted">Edit, publish, unpublish, or delete your uploads.</p>
        </div>
        <Link to="/studio/upload">
          <Button>Upload</Button>
        </Link>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-56 flex-1">
          <Input
            label="Filter by title"
            name="q"
            value={params.get("q") || ""}
            onChange={(e) => {
              const copy = new URLSearchParams(params);
              if (e.target.value) copy.set("q", e.target.value);
              else copy.delete("q");
              setParams(copy);
            }}
          />
        </div>
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Status</span>
          <select
            className="min-h-11 rounded-lg border border-line bg-surface px-3"
            value={filter}
            onChange={(e) => {
              const copy = new URLSearchParams(params);
              copy.set("status", e.target.value);
              setParams(copy);
            }}
          >
            <option value="all">All</option>
            <option value="published">Published</option>
            <option value="unpublished">Unpublished</option>
          </select>
        </label>
      </div>

      {!videos.data?.results.length ? (
        <EmptyState
          title="No creator videos"
          description="You have not uploaded anything yet."
          actionLabel="Upload a video"
          onAction={() => navigate("/studio/upload")}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No matches"
          description="Try a different title filter or status."
        />
      ) : (
        <ul className="grid gap-3">
          {filtered.map((video) => (
            <li
              key={video._id}
              className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4 md:flex-row md:items-center"
            >
              {video.thumbnail ? (
                <img
                  src={video.thumbnail}
                  alt=""
                  className="h-24 w-40 rounded-lg object-cover"
                />
              ) : null}
              <div className="min-w-0 flex-1">
                <p className="font-medium">{video.title}</p>
                <p className="text-sm text-muted">
                  {formatViews(video.views)} views
                  {video.createdAt ? ` · ${formatRelativeDate(video.createdAt)}` : ""}
                </p>
                <div className="mt-1">
                  <Badge>{video.isPublished ? "Published" : "Unpublished"}</Badge>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link to={`/watch/${video._id}`}>
                  <Button variant="ghost">View</Button>
                </Link>
                <Button variant="secondary" onClick={() => setEdit(video)}>
                  Edit
                </Button>
                <Button
                  variant="secondary"
                  disabled={togglePublish.isPending}
                  onClick={async () => {
                    try {
                      await togglePublish.mutateAsync(video._id);
                      toast.push(
                        video.isPublished ? "Video unpublished." : "Video published."
                      );
                    } catch (err) {
                      toast.push(toUserMessage(err));
                    }
                  }}
                >
                  {video.isPublished ? "Unpublish" : "Publish"}
                </Button>
                <Button variant="danger" onClick={() => setDel(video)}>
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {videos.data ? (
        <Pagination
          page={videos.data.page}
          totalPages={videos.data.totalPages}
          hasNextPage={videos.data.hasNextPage}
          hasPreviousPage={videos.data.hasPreviousPage}
          onPage={setPage}
        />
      ) : null}

      <EditVideoModal
        video={edit}
        pending={update.isPending}
        onClose={() => setEdit(null)}
        onSave={async (body) => {
          if (!edit) return;
          try {
            await update.mutateAsync({ videoId: edit._id, body });
            toast.push("Video updated.");
            setEdit(null);
          } catch (err) {
            toast.push(toUserMessage(err));
          }
        }}
      />

      <ConfirmDialog
        open={Boolean(del)}
        title="Delete this video?"
        message="This removes the video, its comments, likes, and playlist references. This cannot be undone."
        confirmLabel="Delete video"
        onClose={() => setDel(null)}
        onConfirm={() => {
          if (!del) return;
          void (async () => {
            try {
              await remove.mutateAsync(del._id);
              toast.push("Video deleted.");
            } catch (err) {
              toast.push(toUserMessage(err));
            }
          })();
        }}
      />
    </div>
  );
};

const EditVideoModal = ({
  video,
  pending,
  onClose,
  onSave,
}: {
  video: Video | null;
  pending: boolean;
  onClose: () => void;
  onSave: (body: FormData) => Promise<void>;
}) => (
  <Modal open={Boolean(video)} title="Edit video" onClose={onClose}>
    {video ? (
      <EditForm key={video._id} video={video} pending={pending} onSave={onSave} />
    ) : null}
  </Modal>
);

const EditForm = ({
  video,
  pending,
  onSave,
}: {
  video: Video;
  pending: boolean;
  onSave: (body: FormData) => Promise<void>;
}) => {
  const [title, setTitle] = useState(video.title);
  const [description, setDescription] = useState(video.description);
  const [thumb, setThumb] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="grid gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        const nextTitle = title.trim();
        const nextDesc = description.trim();
        if (!nextTitle || !nextDesc) {
          setError("Title and description cannot be empty.");
          return;
        }
        const form = new FormData();
        form.append("title", nextTitle);
        form.append("description", nextDesc);
        if (thumb) form.append("thumbnail", thumb);
        setError(null);
        void onSave(form);
      }}
    >
      <Input
        label="Title"
        name="title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <Textarea
        label="Description"
        name="description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <Input
        label="New thumbnail (optional)"
        name="thumbnail"
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={(e) => setThumb(e.target.files?.[0] ?? null)}
      />
      {error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
      </div>
    </form>
  );
};

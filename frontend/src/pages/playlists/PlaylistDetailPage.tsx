import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  useAddVideoToPlaylist,
  useDeletePlaylist,
  usePlaylist,
  useRemoveVideoFromPlaylist,
  useUpdatePlaylist,
} from "@/features/playlists/hooks";
import { useDashboardVideos } from "@/features/videos/hooks";
import { useAuthStore } from "@/store/authStore";
import { VideoGrid } from "@/components/video/VideoGrid";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { AppApiError, toUserMessage } from "@/lib/apiError";
import { ownerId } from "@/lib/format";
import { useToast } from "@/components/ui/useToast";
import type { Video } from "@/types/api";

export const PlaylistDetailPage = () => {
  const { playlistId } = useParams<{ playlistId: string }>();
  const query = usePlaylist(playlistId);
  const user = useAuthStore((s) => s.user);
  const toast = useToast();
  const navigate = useNavigate();
  const update = useUpdatePlaylist();
  const remove = useDeletePlaylist();
  const addVideo = useAddVideoToPlaylist();
  const removeVideo = useRemoveVideoFromPlaylist();
  const [editing, setEditing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [del, setDel] = useState(false);

  if (query.isLoading) return <Skeleton className="h-64" />;
  if (query.isError) {
    const notFound =
      query.error instanceof AppApiError && query.error.status === 404;
    return (
      <ErrorState
        title={notFound ? "Playlist not found" : "Could not load playlist"}
        message={toUserMessage(query.error)}
        onRetry={notFound ? undefined : () => void query.refetch()}
      />
    );
  }

  const playlist = query.data;
  if (!playlist || !playlistId) {
    return <ErrorState title="Playlist not found" message="That playlist does not exist." />;
  }

  const owner = typeof playlist.owner === "object" ? playlist.owner : null;
  const isOwner = ownerId(playlist.owner) === user?._id;
  const videos = (playlist.videos ?? []).filter(
    (item): item is Video => typeof item === "object" && item !== null && "_id" in item
  );

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted">Playlist</p>
          <h1 className="font-display text-3xl">{playlist.name}</h1>
          <p className="mt-2 max-w-2xl text-muted">{playlist.description}</p>
          {owner ? (
            <Link
              className="mt-2 inline-block text-sm text-accent underline"
              to={`/channel/${encodeURIComponent(owner.username)}`}
            >
              {owner.fullname}
            </Link>
          ) : null}
          <p className="mt-1 text-sm text-muted">{videos.length} videos</p>
        </div>
        {isOwner ? (
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setAdding(true)}>
              Add video
            </Button>
            <Button variant="secondary" onClick={() => setEditing(true)}>
              Edit
            </Button>
            <Button variant="danger" onClick={() => setDel(true)}>
              Delete
            </Button>
          </div>
        ) : null}
      </div>

      {videos.length === 0 ? (
        <EmptyState
          title="This playlist is empty"
          description={
            isOwner
              ? "Add one of your videos, or save a video from a watch page."
              : "The owner has not added published videos yet."
          }
        />
      ) : (
        <div className="grid gap-4">
          <VideoGrid videos={videos} />
          {isOwner ? (
            <ul className="grid gap-2">
              {videos.map((video) => (
                <li
                  key={video._id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-line px-3 py-2"
                >
                  <span className="truncate text-sm">{video.title}</span>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      void removeVideo
                        .mutateAsync({ playlistId, videoId: video._id })
                        .then(
                          () => toast.push("Removed from playlist."),
                          (err) => toast.push(toUserMessage(err))
                        );
                    }}
                  >
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      )}

      <Modal open={editing} title="Edit playlist" onClose={() => setEditing(false)}>
        <EditPlaylistForm
          name={playlist.name}
          description={playlist.description}
          pending={update.isPending}
          onSave={async (body) => {
            try {
              await update.mutateAsync({ playlistId, body });
              toast.push("Playlist updated.");
              setEditing(false);
            } catch (err) {
              toast.push(toUserMessage(err));
            }
          }}
        />
      </Modal>

      <AddVideoDialog
        open={adding}
        existingIds={new Set(videos.map((v) => v._id))}
        pending={addVideo.isPending}
        onClose={() => setAdding(false)}
        onAdd={async (videoId) => {
          try {
            await addVideo.mutateAsync({ playlistId, videoId });
            toast.push("Video added.");
            setAdding(false);
          } catch (err) {
            toast.push(toUserMessage(err));
          }
        }}
      />

      <ConfirmDialog
        open={del}
        title="Delete playlist?"
        message="Videos stay on Vidzora; only this playlist is removed."
        confirmLabel="Delete"
        onClose={() => setDel(false)}
        onConfirm={() => {
          void remove.mutateAsync(playlistId).then(
            () => {
              toast.push("Playlist deleted.");
              navigate("/playlists");
            },
            (err) => toast.push(toUserMessage(err))
          );
        }}
      />
    </div>
  );
};

const EditPlaylistForm = ({
  name,
  description,
  pending,
  onSave,
}: {
  name: string;
  description: string;
  pending: boolean;
  onSave: (body: { name: string; description: string }) => Promise<void>;
}) => {
  const [nextName, setNextName] = useState(name);
  const [nextDesc, setNextDesc] = useState(description);
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      className="grid gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!nextName.trim() || !nextDesc.trim()) {
          setError("Name and description cannot be empty.");
          return;
        }
        setError(null);
        void onSave({ name: nextName.trim(), description: nextDesc.trim() });
      }}
    >
      <Input label="Name" name="name" value={nextName} onChange={(e) => setNextName(e.target.value)} />
      <Textarea
        label="Description"
        name="description"
        value={nextDesc}
        onChange={(e) => setNextDesc(e.target.value)}
      />
      {error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save"}
      </Button>
    </form>
  );
};

const AddVideoDialog = ({
  open,
  existingIds,
  pending,
  onClose,
  onAdd,
}: {
  open: boolean;
  existingIds: Set<string>;
  pending: boolean;
  onClose: () => void;
  onAdd: (videoId: string) => Promise<void>;
}) => {
  const own = useDashboardVideos(1, 50);
  const choices = useMemo(
    () => (own.data?.results ?? []).filter((video) => !existingIds.has(video._id)),
    [own.data, existingIds]
  );

  return (
    <Modal open={open} title="Add a video" onClose={onClose}>
      <p className="mb-3 text-sm text-muted">
        The API adds videos by id. This list is your studio library so you can pick one.
      </p>
      {own.isLoading ? <Skeleton className="h-24" /> : null}
      {own.isError ? <p className="text-sm text-danger">{toUserMessage(own.error)}</p> : null}
      {own.data && choices.length === 0 ? (
        <p className="text-sm text-muted">No additional videos to add from your library.</p>
      ) : (
        <ul className="grid max-h-80 gap-2 overflow-auto">
          {choices.map((video) => (
            <li key={video._id} className="flex items-center justify-between gap-2">
              <span className="truncate text-sm">{video.title}</span>
              <Button
                variant="secondary"
                disabled={pending}
                onClick={() => void onAdd(video._id)}
              >
                Add
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
};

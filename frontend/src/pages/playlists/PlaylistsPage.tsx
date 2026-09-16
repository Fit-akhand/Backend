import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  useCreatePlaylist,
  useDeletePlaylist,
  useUserPlaylists,
} from "@/features/playlists/hooks";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { toUserMessage } from "@/lib/apiError";
import { useToast } from "@/components/ui/useToast";
import type { Playlist, Video } from "@/types/api";

export const PlaylistsPage = () => {
  const user = useAuthStore((s) => s.user);
  const playlists = useUserPlaylists(user?._id);
  const create = useCreatePlaylist();
  const remove = useDeletePlaylist();
  const toast = useToast();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [del, setDel] = useState<Playlist | null>(null);

  if (playlists.isLoading) return <Skeleton className="h-48" />;
  if (playlists.isError) {
    return (
      <ErrorState
        title="Could not load playlists"
        message={toUserMessage(playlists.error)}
        onRetry={() => void playlists.refetch()}
      />
    );
  }

  const items = playlists.data ?? [];

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">Playlists</h1>
          <p className="text-muted">Collections you create on Vidzora.</p>
        </div>
        <Button onClick={() => setOpen(true)}>New playlist</Button>
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="No playlists yet"
          description="Create a playlist, then add videos from a watch page or playlist detail."
          actionLabel="Create playlist"
          onAction={() => setOpen(true)}
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {items.map((playlist) => {
            const count = Array.isArray(playlist.videos) ? playlist.videos.length : 0;
            const first = Array.isArray(playlist.videos)
              ? playlist.videos.find((v): v is Video => typeof v === "object" && v !== null)
              : undefined;
            return (
              <li key={playlist._id}>
                <Card className="overflow-hidden">
                  <Link to={`/playlist/${playlist._id}`} className="block">
                    <div className="grid aspect-video place-items-center bg-line text-sm text-muted">
                      {first && typeof first === "object" && first.thumbnail ? (
                        <img
                          src={first.thumbnail}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        `${count} videos`
                      )}
                    </div>
                    <div className="p-4">
                      <h2 className="font-medium">{playlist.name}</h2>
                      <p className="mt-1 line-clamp-2 text-sm text-muted">
                        {playlist.description}
                      </p>
                      <p className="mt-2 text-xs text-muted">{count} videos</p>
                    </div>
                  </Link>
                  <div className="flex justify-end gap-2 px-4 pb-4">
                    <Button variant="danger" onClick={() => setDel(playlist)}>
                      Delete
                    </Button>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <CreatePlaylistDialog
        open={open}
        pending={create.isPending}
        onClose={() => setOpen(false)}
        onSubmit={async (body) => {
          try {
            const created = await create.mutateAsync(body);
            toast.push("Playlist created.");
            setOpen(false);
            navigate(`/playlist/${created._id}`);
          } catch (err) {
            toast.push(toUserMessage(err));
          }
        }}
      />

      <ConfirmDialog
        open={Boolean(del)}
        title="Delete playlist?"
        message="The playlist will be removed. Videos themselves are not deleted."
        confirmLabel="Delete"
        onClose={() => setDel(null)}
        onConfirm={() => {
          if (!del) return;
          void remove.mutateAsync(del._id).then(
            () => toast.push("Playlist deleted."),
            (err) => toast.push(toUserMessage(err))
          );
        }}
      />
    </div>
  );
};

export const CreatePlaylistDialog = ({
  open,
  pending,
  onClose,
  onSubmit,
}: {
  open: boolean;
  pending: boolean;
  onClose: () => void;
  onSubmit: (body: { name: string; description: string }) => Promise<void>;
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !description.trim()) {
      setError("Name and description are required.");
      return;
    }
    setError(null);
    void onSubmit({ name: name.trim(), description: description.trim() });
  };

  return (
    <Modal open={open} title="New playlist" onClose={onClose}>
      <form className="grid gap-3" onSubmit={submit}>
        <Input
          label="Name"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Textarea
          label="Description"
          name="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        {error ? (
          <p className="text-sm text-danger" role="alert">
            {error}
          </p>
        ) : null}
        <Button type="submit" disabled={pending}>
          {pending ? "Creating…" : "Create"}
        </Button>
      </form>
    </Modal>
  );
};

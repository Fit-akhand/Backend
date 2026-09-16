import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import {
  useAddVideoToPlaylist,
  useCreatePlaylist,
  useUserPlaylists,
} from "@/features/playlists/hooks";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { toUserMessage } from "@/lib/apiError";
import { useToast } from "@/components/ui/useToast";
import type { Playlist, Video } from "@/types/api";

const videoIdsIn = (playlist: Playlist) => {
  if (!Array.isArray(playlist.videos)) return new Set<string>();
  return new Set(
    playlist.videos.map((item) => (typeof item === "string" ? item : (item as Video)._id))
  );
};

export const SaveToPlaylistButton = ({ videoId }: { videoId: string }) => {
  const userId = useAuthStore((s) => s.user?._id);
  const playlists = useUserPlaylists(userId);
  const add = useAddVideoToPlaylist();
  const create = useCreatePlaylist();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Save to playlist
      </Button>
      <Modal open={open} title="Save to playlist" onClose={() => setOpen(false)}>
        <div className="grid gap-3">
          {playlists.isLoading ? <p className="text-sm text-muted">Loading playlists…</p> : null}
          {playlists.isError ? (
            <p className="text-sm text-danger">{toUserMessage(playlists.error)}</p>
          ) : null}
          {(playlists.data ?? []).length === 0 && playlists.isSuccess ? (
            <p className="text-sm text-muted">You have no playlists yet. Create one below.</p>
          ) : (
            <ul className="grid max-h-48 gap-2 overflow-auto">
              {(playlists.data ?? []).map((playlist) => {
                const already = videoIdsIn(playlist).has(videoId);
                return (
                  <li key={playlist._id} className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm">{playlist.name}</span>
                    <Button
                      variant="secondary"
                      disabled={already || add.isPending}
                      onClick={() => {
                        void add.mutateAsync({ playlistId: playlist._id, videoId }).then(
                          () => toast.push("Saved to playlist."),
                          (err) => toast.push(toUserMessage(err))
                        );
                      }}
                    >
                      {already ? "Added" : "Add"}
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
          <form
            className="grid gap-2 border-t border-line pt-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!name.trim() || !description.trim()) {
                setError("Name and description are required.");
                return;
              }
              setError(null);
              void (async () => {
                try {
                  const created = await create.mutateAsync({
                    name: name.trim(),
                    description: description.trim(),
                  });
                  await add.mutateAsync({ playlistId: created._id, videoId });
                  toast.push("Playlist created and video saved.");
                  setName("");
                  setDescription("");
                } catch (err) {
                  toast.push(toUserMessage(err));
                }
              })();
            }}
          >
            <p className="text-sm font-medium">New playlist</p>
            <Input label="Name" name="playlistName" value={name} onChange={(e) => setName(e.target.value)} />
            <Textarea
              label="Description"
              name="playlistDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            {error ? (
              <p className="text-sm text-danger" role="alert">
                {error}
              </p>
            ) : null}
            <Button type="submit" disabled={create.isPending || add.isPending}>
              Create and save
            </Button>
          </form>
        </div>
      </Modal>
    </>
  );
};

import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import type { Comment, VideoOwner } from "@/types/api";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Pagination } from "@/components/ui/Pagination";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  useComments,
  useCreateComment,
  useDeleteComment,
  useUpdateComment,
} from "@/features/comments/hooks";
import { useAuthStore } from "@/store/authStore";
import { formatRelativeDate } from "@/lib/format";
import { toUserMessage } from "@/lib/apiError";

const commentOwner = (comment: Comment): VideoOwner | null => {
  if (comment.owner && typeof comment.owner === "object") return comment.owner;
  return null;
};

const CommentItem = ({
  comment,
  currentUserId,
  onEdit,
  onDelete,
  busy,
}: {
  comment: Comment;
  currentUserId?: string;
  onEdit: (id: string, content: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  busy: boolean;
}) => {
  const owner = commentOwner(comment);
  const isOwner =
    currentUserId &&
    (typeof comment.owner === "string"
      ? comment.owner === currentUserId
      : owner?._id === currentUserId);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.content);

  return (
    <li className="flex gap-3 border-b border-line py-4 last:border-0">
      {owner ? (
        <Link to={`/channel/${encodeURIComponent(owner.username)}`}>
          <Avatar src={owner.avatar} alt={owner.fullname} size="sm" />
        </Link>
      ) : (
        <Avatar alt="User" size="sm" />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="text-sm font-medium">
            {owner?.fullname || "User"}
          </span>
          <span className="text-xs text-muted">
            {formatRelativeDate(comment.createdAt)}
          </span>
        </div>
        {editing ? (
          <form
            className="mt-2 grid gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void onEdit(comment._id, draft).then(() => setEditing(false));
            }}
          >
            <Textarea
              label="Edit comment"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={2000}
              required
            />
            <div className="flex gap-2">
              <Button type="submit" disabled={busy || !draft.trim()}>
                Save
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setEditing(false);
                  setDraft(comment.content);
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <p className="mt-1 whitespace-pre-wrap text-sm">{comment.content}</p>
        )}
        {isOwner && !editing ? (
          <div className="mt-2 flex gap-2">
            <Button
              variant="ghost"
              className="min-h-9 px-2 text-xs"
              onClick={() => setEditing(true)}
            >
              Edit
            </Button>
            <Button
              variant="ghost"
              className="min-h-9 px-2 text-xs text-danger"
              disabled={busy}
              onClick={() => void onDelete(comment._id)}
            >
              Delete
            </Button>
          </div>
        ) : null}
      </div>
    </li>
  );
};

export const CommentsSection = ({ videoId }: { videoId: string }) => {
  const user = useAuthStore((s) => s.user);
  const [page, setPage] = useState(1);
  const [content, setContent] = useState("");
  const comments = useComments(videoId, page);
  const create = useCreateComment(videoId);
  const update = useUpdateComment(videoId);
  const remove = useDeleteComment(videoId);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;
    await create.mutateAsync(trimmed);
    setContent("");
    setPage(1);
  };

  return (
    <section aria-labelledby="comments-heading" className="mt-8">
      <h2 id="comments-heading" className="mb-4 font-display text-2xl">
        Comments
        {comments.data ? ` · ${comments.data.total}` : ""}
      </h2>

      <form onSubmit={(e) => void onSubmit(e)} className="mb-6 grid gap-3">
        <Textarea
          label="Add a comment"
          name="comment"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={2000}
          placeholder="Share your thoughts"
          required
        />
        {create.isError ? (
          <p className="text-sm text-danger" role="alert">
            {toUserMessage(create.error)}
          </p>
        ) : null}
        <div>
          <Button type="submit" disabled={create.isPending || !content.trim()}>
            {create.isPending ? "Posting…" : "Comment"}
          </Button>
        </div>
      </form>

      {comments.isLoading ? (
        <div className="grid gap-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : null}

      {comments.isError ? (
        <ErrorState
          message={toUserMessage(comments.error)}
          onRetry={() => void comments.refetch()}
        />
      ) : null}

      {comments.data && comments.data.results.length === 0 ? (
        <EmptyState
          title="No comments yet"
          description="Be the first to leave a comment on this video."
        />
      ) : null}

      {comments.data && comments.data.results.length > 0 ? (
        <>
          <ul className="divide-y-0">
            {comments.data.results.map((comment) => (
              <CommentItem
                key={comment._id}
                comment={comment}
                currentUserId={user?._id}
                busy={update.isPending || remove.isPending}
                onEdit={async (id, text) => {
                  await update.mutateAsync({ commentId: id, content: text });
                }}
                onDelete={async (id) => {
                  await remove.mutateAsync(id);
                }}
              />
            ))}
          </ul>
          <Pagination
            page={comments.data.page}
            totalPages={comments.data.totalPages}
            hasNextPage={comments.data.hasNextPage}
            hasPreviousPage={comments.data.hasPreviousPage}
            onPage={setPage}
          />
        </>
      ) : null}
    </section>
  );
};

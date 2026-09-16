import { Link } from "react-router-dom";
import type { Video, VideoOwner } from "@/types/api";
import { formatDuration, formatRelativeDate, formatViews } from "@/lib/format";
import { Avatar } from "@/components/ui/Avatar";

const ownerOf = (video: Video): VideoOwner | null => {
  if (video.owner && typeof video.owner === "object") return video.owner;
  return null;
};

export const VideoCard = ({ video }: { video: Video }) => {
  const owner = ownerOf(video);
  const duration = formatDuration(video.duration);
  const thumb = video.thumbnail?.trim();

  return (
    <article className="group">
      <Link
        to={`/watch/${video._id}`}
        className="relative block overflow-hidden rounded-xl bg-line focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        aria-label={`Watch ${video.title}`}
      >
        {thumb ? (
          <img
            src={thumb}
            alt=""
            loading="lazy"
            className="aspect-video w-full object-cover transition group-hover:scale-[1.02]"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <div className="grid aspect-video place-items-center bg-line text-sm text-muted">
            No thumbnail
          </div>
        )}
        {duration ? (
          <span className="absolute right-2 bottom-2 rounded bg-black/75 px-1.5 py-0.5 text-xs text-white">
            {duration}
          </span>
        ) : null}
      </Link>
      <div className="mt-2 flex gap-2">
        {owner ? (
          <Link
            to={`/channel/${encodeURIComponent(owner.username)}`}
            className="shrink-0"
            aria-label={`${owner.fullname}'s channel`}
          >
            <Avatar src={owner.avatar} alt="" size="sm" />
          </Link>
        ) : null}
        <div className="min-w-0">
          <Link
            to={`/watch/${video._id}`}
            className="line-clamp-2 font-medium leading-snug hover:underline"
          >
            {video.title}
          </Link>
          {owner ? (
            <Link
              to={`/channel/${encodeURIComponent(owner.username)}`}
              className="mt-0.5 block truncate text-sm text-muted hover:underline"
            >
              {owner.fullname}
            </Link>
          ) : null}
          <p className="text-sm text-muted">
            {formatViews(video.views)} views
            {video.createdAt ? ` · ${formatRelativeDate(video.createdAt)}` : ""}
          </p>
        </div>
      </div>
    </article>
  );
};

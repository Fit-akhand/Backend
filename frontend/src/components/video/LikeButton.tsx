import { ThumbsUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { useToggleVideoLike, useVideoLikeState } from "@/features/likes/hooks";
import { useAuthStore } from "@/store/authStore";
import { toUserMessage } from "@/lib/apiError";
import { AppApiError } from "@/lib/apiError";

type Props = {
  videoId: string;
};

export const LikeButton = ({ videoId }: Props) => {
  const status = useAuthStore((s) => s.status);
  const navigate = useNavigate();
  const likeState = useVideoLikeState(videoId);
  const toggle = useToggleVideoLike(videoId);

  const liked = likeState.data?.liked ?? false;
  const likes = likeState.data?.likes;

  const onClick = async () => {
    if (status !== "authenticated") {
      navigate("/login", { state: { from: `/watch/${videoId}` } });
      return;
    }
    try {
      await toggle.mutateAsync();
    } catch (error) {
      if (error instanceof AppApiError && error.status === 401) {
        navigate("/login", { state: { from: `/watch/${videoId}` } });
      }
    }
  };

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        variant={liked ? "primary" : "secondary"}
        onClick={() => void onClick()}
        disabled={toggle.isPending || likeState.isLoading}
        aria-pressed={liked}
        aria-label={liked ? "Unlike video" : "Like video"}
      >
        <ThumbsUp size={16} fill={liked ? "currentColor" : "none"} />
        {liked ? "Liked" : "Like"}
        {typeof likes === "number" ? ` · ${likes}` : ""}
      </Button>
      {toggle.isError ? (
        <p className="text-xs text-danger" role="alert">
          {toUserMessage(toggle.error)}
        </p>
      ) : null}
    </div>
  );
};

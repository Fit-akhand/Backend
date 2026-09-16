import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { useToggleSubscription } from "@/features/subscriptions/hooks";
import { useAuthStore } from "@/store/authStore";
import { AppApiError, toUserMessage } from "@/lib/apiError";

type Props = {
  channelId: string;
  username: string;
  isSubscribed: boolean;
  isOwnChannel?: boolean;
};

export const SubscribeButton = ({
  channelId,
  username,
  isSubscribed,
  isOwnChannel,
}: Props) => {
  const status = useAuthStore((s) => s.status);
  const navigate = useNavigate();
  const toggle = useToggleSubscription(username);

  if (isOwnChannel) {
    return (
      <Button variant="secondary" disabled>
        Your channel
      </Button>
    );
  }

  const onClick = async () => {
    if (status !== "authenticated") {
      navigate("/login", { state: { from: `/channel/${username}` } });
      return;
    }
    try {
      await toggle.mutateAsync(channelId);
    } catch (error) {
      if (error instanceof AppApiError && error.status === 401) {
        navigate("/login", { state: { from: `/channel/${username}` } });
      }
    }
  };

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        variant={isSubscribed ? "secondary" : "primary"}
        onClick={() => void onClick()}
        disabled={toggle.isPending}
        aria-pressed={isSubscribed}
      >
        {toggle.isPending
          ? "Updating…"
          : isSubscribed
            ? "Subscribed"
            : "Subscribe"}
      </Button>
      {toggle.isError ? (
        <p className="text-xs text-danger" role="alert">
          {toUserMessage(toggle.error)}
        </p>
      ) : null}
    </div>
  );
};

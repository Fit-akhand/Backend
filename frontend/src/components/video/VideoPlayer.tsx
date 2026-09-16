import { useState } from "react";
import { ErrorState } from "@/components/ui/ErrorState";
import { Spinner } from "@/components/ui/Spinner";

type Props = {
  src: string;
  poster?: string;
  title: string;
};

export const VideoPlayer = ({ src, poster, title }: Props) => {
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  if (!src) {
    return (
      <ErrorState
        title="Video unavailable"
        message="This video has no playable URL."
      />
    );
  }

  if (failed) {
    return (
      <ErrorState
        title="Playback failed"
        message="The video could not be loaded. Check your connection or try again later."
        onRetry={() => {
          setFailed(false);
          setReady(false);
        }}
      />
    );
  }

  return (
    <div className="relative overflow-hidden rounded-xl bg-black">
      {!ready ? (
        <div className="absolute inset-0 z-10 grid place-items-center bg-black/40">
          <Spinner label="Loading video" />
        </div>
      ) : null}
      <video
        key={src}
        className="aspect-video w-full"
        controls
        playsInline
        preload="metadata"
        poster={poster || undefined}
        aria-label={title}
        onLoadedData={() => setReady(true)}
        onError={() => setFailed(true)}
      >
        <source src={src} />
      </video>
    </div>
  );
};

type Variant = "full" | "compact" | "icon";

type Props = {
  variant?: Variant;
  className?: string;
};

const Mark = ({ size }: { size: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    focusable="false"
  >
    <rect width="32" height="32" rx="9" fill="currentColor" />
    <path
      d="M13.2 10.4c-.7-.4-1.6.1-1.6.9v9.4c0 .8.9 1.3 1.6.9l8.1-4.7c.7-.4.7-1.4 0-1.8l-8.1-4.7Z"
      fill="var(--accent-fg)"
    />
    <circle cx="24.2" cy="8.2" r="1.35" fill="var(--accent-fg)" opacity="0.85" />
  </svg>
);

export const VidzoraLogo = ({ variant = "compact", className = "" }: Props) => {
  const size = variant === "full" ? 40 : variant === "icon" ? 28 : 32;

  if (variant === "icon") {
    return (
      <span
        className={`inline-flex text-accent ${className}`}
        role="img"
        aria-label="Vidzora"
      >
        <Mark size={size} />
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-2 text-ink ${className}`}
      role="img"
      aria-label={
        variant === "full" ? "Vidzora — Watch. Create. Connect." : "Vidzora"
      }
    >
      <span className="text-accent">
        <Mark size={size} />
      </span>
      <span className="flex flex-col leading-tight">
        <span className="font-display text-xl tracking-tight">Vidzora</span>
        {variant === "full" ? (
          <span className="text-[11px] font-medium tracking-wide text-muted">
            Watch. Create. Connect.
          </span>
        ) : null}
      </span>
    </span>
  );
};

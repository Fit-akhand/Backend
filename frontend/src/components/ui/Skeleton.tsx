export const Skeleton = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse rounded-lg bg-line/70 ${className}`} aria-hidden />
);

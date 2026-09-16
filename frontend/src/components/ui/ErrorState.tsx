import { Button } from "./Button";

type Props = {
  title?: string;
  message: string;
  onRetry?: () => void;
};

export const ErrorState = ({ title = "Something went wrong", message, onRetry }: Props) => (
  <div className="grid place-items-center gap-3 rounded-xl border border-danger/30 bg-surface px-6 py-12 text-center" role="alert">
    <h2 className="font-display text-2xl">{title}</h2>
    <p className="max-w-md text-muted">{message}</p>
    {onRetry ? (
      <Button variant="secondary" onClick={onRetry}>
        Try again
      </Button>
    ) : null}
  </div>
);

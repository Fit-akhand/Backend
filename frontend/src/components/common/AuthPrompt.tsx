import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";

type Props = {
  message?: string;
  from?: string;
};

export const AuthPrompt = ({
  message = "Sign in to continue.",
  from,
}: Props) => (
  <div
    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-3"
    role="status"
  >
    <p className="text-sm text-muted">{message}</p>
    <Link to="/login" state={from ? { from } : undefined}>
      <Button>Sign in</Button>
    </Link>
  </div>
);

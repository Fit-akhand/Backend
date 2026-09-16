import { Link, useNavigate } from "react-router-dom";
import { EmptyState } from "@/components/ui/EmptyState";

export const NotFoundPage = () => {
  const navigate = useNavigate();
  return (
    <div className="grid min-h-dvh place-items-center px-4">
      <EmptyState
        title="Page not found"
        description="That URL is not part of Vidzora."
        actionLabel="Go home"
        onAction={() => navigate("/")}
      />
      <Link className="mt-4 text-sm text-accent underline" to="/">
        Return home
      </Link>
    </div>
  );
};

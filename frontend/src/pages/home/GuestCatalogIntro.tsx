import { Link } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/Button";

export const GuestCatalogIntro = () => {
  const status = useAuthStore((s) => s.status);
  if (status === "authenticated") return null;
  return (
    <section className="mb-8 rounded-2xl border border-line bg-surface px-5 py-6 sm:px-8">
      <p className="text-sm font-medium uppercase tracking-wide text-accent">
        Watch. Create. Connect.
      </p>
      <h2 className="mt-1 font-display text-2xl sm:text-3xl">Public catalog</h2>
      <p className="mt-2 max-w-2xl text-muted">
        Browse published videos without an account. Sign in to like, comment, subscribe,
        and create.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link to="/login">
          <Button>Sign in</Button>
        </Link>
        <Link to="/register">
          <Button variant="secondary">Join Vidzora</Button>
        </Link>
      </div>
    </section>
  );
};

import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { VidzoraLogo } from "@/brand/VidzoraLogo";

export const LandingPage = () => (
  <div className="mx-auto grid min-h-dvh max-w-3xl place-content-center gap-6 px-6 py-16 text-center">
    <div className="mx-auto">
      <VidzoraLogo variant="full" />
    </div>
    <h1 className="sr-only">Vidzora — Watch. Create. Connect.</h1>
    <p className="text-lg text-muted">Watch. Create. Connect.</p>
    <p className="text-muted">
      Browse the public catalog, or sign in to like, comment, subscribe, and create.
    </p>
    <div className="flex justify-center gap-3">
      <Link to="/">
        <Button variant="secondary">Browse videos</Button>
      </Link>
      <Link to="/login">
        <Button>Sign in</Button>
      </Link>
      <Link to="/register">
        <Button variant="secondary">Create account</Button>
      </Link>
    </div>
  </div>
);

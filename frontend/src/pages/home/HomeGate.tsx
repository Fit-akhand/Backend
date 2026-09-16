import { AppShell } from "@/components/layout/AppShell";
import { Spinner } from "@/components/ui/Spinner";
import { useAuthStore } from "@/store/authStore";
import { HomePage } from "./HomePage";
import { LandingPage } from "./LandingPage";

export const HomeGate = () => {
  const status = useAuthStore((s) => s.status);
  if (status === "loading") return <Spinner label="Loading Vidzora" />;
  if (status === "authenticated") {
    return (
      <AppShell>
        <HomePage />
      </AppShell>
    );
  }
  return <LandingPage />;
};

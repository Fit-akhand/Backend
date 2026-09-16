import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { Spinner } from "@/components/ui/Spinner";

export const ProtectedRoute = () => {
  const status = useAuthStore((s) => s.status);
  const location = useLocation();

  if (status === "loading") {
    return <Spinner label="Checking session" />;
  }

  if (status !== "authenticated") {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
};

export const GuestRoute = () => {
  const status = useAuthStore((s) => s.status);

  if (status === "loading") {
    return <Spinner label="Checking session" />;
  }

  if (status === "authenticated") {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

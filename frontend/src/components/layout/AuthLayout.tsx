import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { VidzoraLogo } from "@/brand/VidzoraLogo";

export const AuthLayout = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => (
  <div className="grid min-h-dvh place-items-center px-4 py-10">
    <div className="w-full max-w-md">
      <Link to="/" className="mb-6 flex items-center justify-center">
        <VidzoraLogo variant="full" />
      </Link>
      <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm">
        <h1 className="mb-4 font-display text-3xl">{title}</h1>
        {children}
      </div>
    </div>
  </div>
);

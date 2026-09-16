import type { ReactNode } from "react";

export const Badge = ({ children }: { children: ReactNode }) => (
  <span className="inline-flex rounded-full bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent">
    {children}
  </span>
);

import type { ReactNode } from "react";
import { Button } from "./Button";

type Props = {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: ReactNode;
};

export const EmptyState = ({ title, description, actionLabel, onAction, icon }: Props) => (
  <div className="grid place-items-center gap-3 rounded-xl border border-dashed border-line px-6 py-16 text-center">
    {icon}
    <h2 className="font-display text-2xl">{title}</h2>
    <p className="max-w-md text-muted">{description}</p>
    {actionLabel && onAction ? <Button onClick={onAction}>{actionLabel}</Button> : null}
  </div>
);

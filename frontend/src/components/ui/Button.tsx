import type { ButtonHTMLAttributes, ReactNode } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  children: ReactNode;
};

const styles = {
  primary: "bg-accent text-[var(--accent-fg)] hover:opacity-90",
  secondary: "bg-surface border border-line text-ink hover:bg-paper",
  ghost: "text-ink hover:bg-surface",
  danger: "bg-danger text-white hover:opacity-90",
};

export const Button = ({
  variant = "primary",
  className = "",
  type = "button",
  children,
  ...props
}: Props) => (
  <button
    type={type}
    className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`}
    {...props}
  >
    {children}
  </button>
);

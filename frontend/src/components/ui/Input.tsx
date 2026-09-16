import type { InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export const Input = ({ label, error, id, className = "", ...props }: Props) => {
  const inputId = id ?? props.name;
  return (
    <label className="grid gap-1 text-sm" htmlFor={inputId}>
      <span className="font-medium text-ink">{label}</span>
      <input
        id={inputId}
        className={`min-h-11 rounded-lg border border-line bg-surface px-3 text-ink placeholder:text-muted ${className}`}
        {...props}
      />
      {error ? (
        <span className="text-danger" role="alert">
          {error}
        </span>
      ) : null}
    </label>
  );
};

import type { TextareaHTMLAttributes } from "react";

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  error?: string;
};

export const Textarea = ({ label, error, id, className = "", ...props }: Props) => {
  const inputId = id ?? props.name;
  return (
    <label className="grid gap-1 text-sm" htmlFor={inputId}>
      <span className="font-medium text-ink">{label}</span>
      <textarea
        id={inputId}
        className={`min-h-28 rounded-lg border border-line bg-surface px-3 py-2 text-ink ${className}`}
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

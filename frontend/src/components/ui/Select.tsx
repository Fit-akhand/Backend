import type { SelectHTMLAttributes } from "react";

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
};

export const Select = ({ label, id, children, className = "", ...props }: Props) => {
  const inputId = id ?? props.name;
  return (
    <label className="grid gap-1 text-sm" htmlFor={inputId}>
      <span className="font-medium text-ink">{label}</span>
      <select
        id={inputId}
        className={`min-h-11 rounded-lg border border-line bg-surface px-3 text-ink ${className}`}
        {...props}
      >
        {children}
      </select>
    </label>
  );
};

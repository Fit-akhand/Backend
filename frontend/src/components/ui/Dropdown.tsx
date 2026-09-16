import { useState, type ReactNode } from "react";

type Props = {
  label: ReactNode;
  children: ReactNode;
};

export const Dropdown = ({ label, children }: Props) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        className="inline-flex min-h-11 items-center rounded-lg px-2"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
      >
        {label}
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-1 min-w-44 rounded-lg border border-line bg-surface py-1 shadow-lg"
        >
          <div onClick={() => setOpen(false)}>{children}</div>
        </div>
      ) : null}
    </div>
  );
};

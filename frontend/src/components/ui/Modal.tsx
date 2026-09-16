import { useEffect, useRef, type ReactNode } from "react";
import { Button } from "./Button";

type Props = {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
};

export const Modal = ({ open, title, children, onClose }: Props) => {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (open && !node.open) node.showModal();
    if (!open && node.open) node.close();
  }, [open]);

  if (!open) return null;

  return (
    <dialog
      ref={ref}
      className="w-[min(32rem,calc(100%-2rem))] rounded-xl border border-line bg-surface p-5 text-ink shadow-lg backdrop:bg-black/40"
      onClose={onClose}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <h2 className="font-display text-xl">{title}</h2>
        <Button variant="ghost" onClick={onClose} aria-label="Close dialog">
          Close
        </Button>
      </div>
      {children}
    </dialog>
  );
};

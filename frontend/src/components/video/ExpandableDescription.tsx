import { useState } from "react";
import { Button } from "@/components/ui/Button";

type Props = {
  text: string;
  maxChars?: number;
};

/** Plain-text description — never injects HTML from user content. */
export const ExpandableDescription = ({ text, maxChars = 220 }: Props) => {
  const [open, setOpen] = useState(false);
  const trimmed = text?.trim() || "";
  if (!trimmed) {
    return <p className="text-sm text-muted">No description.</p>;
  }
  const needsToggle = trimmed.length > maxChars;
  const shown = !needsToggle || open ? trimmed : `${trimmed.slice(0, maxChars).trimEnd()}…`;

  return (
    <div className="rounded-xl bg-surface px-4 py-3">
      <p className="whitespace-pre-wrap text-sm leading-relaxed">{shown}</p>
      {needsToggle ? (
        <Button
          variant="ghost"
          className="mt-1 min-h-9 px-0 text-accent"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          {open ? "Show less" : "Show more"}
        </Button>
      ) : null}
    </div>
  );
};

import type { ReactNode } from "react";

type Item = { id: string; label: string; panel: ReactNode };

export const Tabs = ({ items, value, onChange }: { items: Item[]; value: string; onChange: (id: string) => void }) => (
  <div>
    <div role="tablist" className="flex gap-2 border-b border-line">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          role="tab"
          aria-selected={value === item.id}
          aria-controls={`tab-panel-${item.id}`}
          id={`tab-${item.id}`}
          className={`min-h-11 px-3 text-sm ${value === item.id ? "border-b-2 border-accent font-medium" : "text-muted"}`}
          onClick={() => onChange(item.id)}
        >
          {item.label}
        </button>
      ))}
    </div>
    <div
      className="pt-4"
      role="tabpanel"
      id={`tab-panel-${value}`}
      aria-labelledby={`tab-${value}`}
    >
      {items.find((item) => item.id === value)?.panel}
    </div>
  </div>
);

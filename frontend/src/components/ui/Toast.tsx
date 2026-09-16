import { useCallback, useMemo, useState, type ReactNode } from "react";
import { ToastContext } from "./toastContext";

type Toast = { id: number; message: string };

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<Toast[]>([]);
  const push = useCallback((message: string) => {
    const id = Date.now();
    setItems((current) => [...current, { id, message }]);
    window.setTimeout(() => {
      setItems((current) => current.filter((item) => item.id !== id));
    }, 4000);
  }, []);
  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 bottom-20 z-50 grid gap-2 md:bottom-4" aria-live="polite">
        {items.map((item) => (
          <div key={item.id} className="pointer-events-auto rounded-lg bg-ink px-4 py-2 text-sm text-[var(--paper)] shadow">
            {item.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

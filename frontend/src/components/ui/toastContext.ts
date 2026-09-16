import { createContext } from "react";

export const ToastContext = createContext<{ push: (message: string) => void } | null>(null);

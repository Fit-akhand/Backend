const THEME_KEY = "vidzora-theme";
const LEGACY_THEME_KEY = "ak-tube-theme";

const readStored = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(THEME_KEY) ?? localStorage.getItem(LEGACY_THEME_KEY);
};

const stored = readStored();
const prefersDark =
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-color-scheme: dark)").matches;

if (stored === "dark" || (!stored && prefersDark)) {
  document.documentElement.classList.add("dark");
}

export const getTheme = () =>
  document.documentElement.classList.contains("dark") ? "dark" : "light";

export const setTheme = (theme: "light" | "dark") => {
  document.documentElement.classList.toggle("dark", theme === "dark");
  localStorage.setItem(THEME_KEY, theme);
};

export const toggleTheme = () => {
  setTheme(getTheme() === "dark" ? "light" : "dark");
};

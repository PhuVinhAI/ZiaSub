import type { ThemeMode } from "../types/settings";

const darkModeQuery = window.matchMedia("(prefers-color-scheme: dark)");
let currentMode: ThemeMode = "system";
let listening = false;

function resolvedTheme(mode: ThemeMode): "light" | "dark" {
  if (mode === "system") {
    return darkModeQuery.matches ? "dark" : "light";
  }
  return mode;
}

export function applyTheme(mode: ThemeMode): void {
  currentMode = mode;
  document.documentElement.dataset.theme = resolvedTheme(mode);

  if (!listening) {
    darkModeQuery.addEventListener("change", () => {
      if (currentMode === "system") {
        document.documentElement.dataset.theme = resolvedTheme("system");
      }
    });
    listening = true;
  }
}

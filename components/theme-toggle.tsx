"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

type Theme = "light" | "dark";

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  localStorage.setItem("theme", theme);
}

export function ThemeToggle() {
  // Starts unresolved so the server-rendered markup matches the initial
  // client render; the real value comes from the inline init script's
  // class on <html>, read here just after mount.
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    // Must read after mount (not via a lazy useState initializer) so this
    // matches the server-rendered markup and avoids a hydration mismatch —
    // the inline init script sets the class before React ever runs.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
  }

  return (
    <button
      onClick={toggle}
      disabled={!theme}
      aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-muted transition hover:bg-surface-hover hover:text-foreground disabled:opacity-0"
    >
      {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
    </button>
  );
}

"use client";

import { useEffect, useState } from "react";

type Theme = "dark" | "light";

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.style.colorScheme = theme;
  localStorage.setItem("theme", theme);
}

export function ThemeToggle() {
  // Starts null so the server-rendered markup and the client's first paint
  // agree — the inline script in app/layout.tsx already set the real
  // data-theme attribute before hydration (avoiding a flash of the wrong
  // theme), this just reads it back into state once mounted.
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    const sync = () => setTheme(document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark");
    sync();
  }, []);

  if (theme === null) {
    return <span className="btn-icon opacity-0" aria-hidden="true" />;
  }

  return (
    <button
      type="button"
      className="btn-icon"
      aria-label={theme === "light" ? "Mudar para tema escuro" : "Mudar para tema claro"}
      title={theme === "light" ? "Tema escuro" : "Tema claro"}
      onClick={() => {
        const next = theme === "light" ? "dark" : "light";
        applyTheme(next);
        setTheme(next);
      }}
    >
      {theme === "light" ? "☾" : "☀"}
    </button>
  );
}

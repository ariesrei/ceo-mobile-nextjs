"use client";

import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import { useEffect, type ReactNode } from "react";

function ThemeChrome() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const light = resolvedTheme === "light";
    document.documentElement.style.colorScheme = light ? "light" : "dark";
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "theme-color");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", light ? "#f4f7fb" : "#0e1116");
  }, [resolvedTheme]);

  return null;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      storageKey="ceo-appearance"
      disableTransitionOnChange
    >
      <ThemeChrome />
      {children}
    </NextThemesProvider>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { DeviceIcon, MoonIcon, SunIcon } from "./ui/Icons";

const OPTIONS = [
  { id: "system", label: "Auto", Icon: DeviceIcon },
  { id: "dark", label: "Dark", Icon: MoonIcon },
  { id: "light", label: "Light", Icon: SunIcon },
] as const;

export function ThemeToggle({
  compact = false,
  variant = "chip",
  className = "",
}: {
  compact?: boolean;
  variant?: "chip" | "row";
  className?: string;
}) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const current = mounted ? theme || "system" : "system";
  const row = variant === "row";

  return (
    <div
      className={`ceo-theme${compact ? " ceo-theme--compact" : ""}${
        row ? " ceo-theme--row" : ""
      }${className ? ` ${className}` : ""}`}
    >
      {compact && !row ? null : <p className="ceo-theme__label">Appearance</p>}
      <div className="ceo-theme__switch" role="group" aria-label="Appearance">
        {OPTIONS.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            className={current === id ? "is-on" : ""}
            aria-label={id === "system" ? "Match device" : label}
            aria-pressed={current === id}
            onClick={() => setTheme(id)}
          >
            <Icon />
            <span>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

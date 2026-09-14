"use client";

import { useEffect, useId, useRef, useState } from "react";

export type MenuSelectOption = { id: string | number; label: string };

type Props = {
  value: string;
  onChange: (value: string) => void;
  options: MenuSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** "inline" for filter rows; "field" for full-width form controls. */
  variant?: "inline" | "field";
  id?: string;
  "aria-label"?: string;
};

export function MenuSelect({
  value,
  onChange,
  options,
  placeholder,
  disabled,
  className = "",
  variant = "field",
  id,
  "aria-label": ariaLabel,
}: Props) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    width: number;
    maxHeight: number;
  } | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const listId = useId();
  const items =
    placeholder != null
      ? [{ id: "", label: placeholder }, ...options]
      : options;
  const current =
    items.find((o) => String(o.id) === String(value)) || items[0];

  useEffect(() => {
    if (!open) return;

    function place() {
      const el = trigger.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const width = Math.max(r.width, variant === "inline" ? 220 : r.width);
      let left = variant === "inline" ? r.right - width : r.left;
      left = Math.min(Math.max(8, left), window.innerWidth - width - 8);
      const spaceBelow = window.innerHeight - r.bottom - 12;
      const spaceAbove = r.top - 12;
      const openUp = spaceBelow < 160 && spaceAbove > spaceBelow;
      const maxHeight = Math.min(256, openUp ? spaceAbove : spaceBelow);
      const top = openUp ? r.top - maxHeight - 6 : r.bottom + 6;
      setCoords({ top, left, width, maxHeight });
    }

    function onDoc(e: MouseEvent) {
      if (root.current && !root.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    place();
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, variant]);

  return (
    <div
      ref={root}
      className={`ceo-menu-select ceo-menu-select--${variant} ${className}`.trim()}
    >
      <button
        ref={trigger}
        type="button"
        id={id}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((v) => !v)}
      >
        <span>{current?.label || placeholder || "Select…"}</span>
      </button>
      {open && coords ? (
        <ul
          id={listId}
          role="listbox"
          className="ceo-menu-select__list"
          style={{
            top: coords.top,
            left: coords.left,
            width: coords.width,
            maxHeight: coords.maxHeight,
          }}
        >
          {items.map((o) => {
            const active = String(o.id) === String(value);
            return (
              <li key={String(o.id) || "empty"}>
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  className={active ? "is-active" : ""}
                  onClick={() => {
                    onChange(String(o.id));
                    setOpen(false);
                  }}
                >
                  {o.label}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

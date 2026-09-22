"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";

export type MenuSelectOption = { id: string | number; label: string };

type Props = {
  value: string;
  onChange: (value: string) => void;
  options: MenuSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
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
  const [mounted, setMounted] = useState(false);
  const listId = useId();
  const items =
    placeholder != null
      ? [{ id: "", label: placeholder }, ...options]
      : options;
  const current =
    items.find((o) => String(o.id) === String(value)) || items[0];

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const sheet =
    open && mounted
      ? createPortal(
          <div className="ceo-menu-select__layer" role="presentation">
            <button
              type="button"
              className="ceo-menu-select__backdrop"
              aria-label="Close menu"
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setOpen(false);
              }}
            />
            <div
              id={listId}
              role="listbox"
              aria-label={ariaLabel}
              className="ceo-menu-select__sheet"
            >
              {ariaLabel ? (
                <p className="ceo-menu-select__sheet-title">{ariaLabel}</p>
              ) : null}
              {items.map((o) => {
                const active = String(o.id) === String(value);
                return (
                  <button
                    key={String(o.id) || "empty"}
                    type="button"
                    role="option"
                    aria-selected={active}
                    className={
                      active
                        ? "ceo-menu-select__option is-active"
                        : "ceo-menu-select__option"
                    }
                    onClick={(e) => {
                      e.stopPropagation();
                      onChange(String(o.id));
                      setOpen(false);
                    }}
                  >
                    {o.label}
                  </button>
                );
              })}
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <div
      className={`ceo-menu-select ceo-menu-select--${variant} ${className}`.trim()}
    >
      <button
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
      {sheet}
    </div>
  );
}

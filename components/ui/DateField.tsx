"use client";

import { useEffect, useId, useRef, useState } from "react";
import { DayPicker } from "react-day-picker";
import { format, isValid, parse } from "date-fns";
import "react-day-picker/style.css";
import { FieldLabel } from "./FieldLabel";

/** ACF / project date storage format: m/d/Y */
const DATE_FORMAT = "MM/dd/yyyy";

function parseStored(value?: string): Date | undefined {
  if (!value?.trim()) return undefined;
  const raw = value.trim();
  const candidates = [
    parse(raw, "MM/dd/yyyy", new Date()),
    parse(raw, "M/d/yyyy", new Date()),
    parse(raw, "yyyy-MM-dd", new Date()),
  ];
  for (const d of candidates) {
    if (isValid(d)) return d;
  }
  return undefined;
}

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  name?: string;
  placeholder?: string;
  required?: boolean;
  /** Cap selectable dates (e.g. birthdays). */
  toDate?: Date;
  /** Earliest selectable date. */
  fromDate?: Date;
  /** Mockup date rows are calendar-only — no Clear chip. */
  showClear?: boolean;
};

export function DateField({
  label,
  value,
  onChange,
  name,
  placeholder = "Select date",
  required,
  toDate,
  fromDate,
  showClear = true,
}: Props) {
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const selected = parseStored(value);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative block space-y-1.5" ref={rootRef}>
      <FieldLabel label={label} required={required} id={`${id}-label`} />
      <div className="flex gap-2">
        <button
          type="button"
          id={id}
          name={name}
          aria-labelledby={`${id}-label`}
          aria-expanded={open}
          aria-haspopup="dialog"
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3.5 py-3 text-left text-[var(--ink)] outline-none ring-[var(--accent)] focus:ring-2"
        >
          <span className={selected ? "" : "text-[var(--muted)]"}>
            {selected ? format(selected, DATE_FORMAT) : placeholder}
          </span>
          <svg
            className="h-5 w-5 shrink-0 text-[var(--muted)]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden
          >
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M8 3v4M16 3v4M3 10h18" />
          </svg>
        </button>
        {showClear && value ? (
          <button
            type="button"
            className="rounded-xl border border-[var(--border)] px-3 text-sm text-[var(--muted)] hover:bg-[var(--surface-2)]"
            onClick={() => onChange("")}
            aria-label="Clear date"
          >
            Clear
          </button>
        ) : null}
      </div>

      {open ? (
        <div
          role="dialog"
          aria-label={label}
          className="ceo-date-popover absolute left-0 right-0 z-50 mt-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-3 shadow-[0_16px_40px_rgba(15,23,42,0.12)]"
        >
          <DayPicker
            mode="single"
            selected={selected}
            captionLayout="dropdown"
            startMonth={fromDate || new Date(1950, 0)}
            endMonth={toDate || new Date(new Date().getFullYear() + 10, 11)}
            disabled={[
              ...(fromDate ? [{ before: fromDate }] : []),
              ...(toDate ? [{ after: toDate }] : []),
            ]}
            onSelect={(day) => {
              if (!day) {
                onChange("");
                return;
              }
              onChange(format(day, DATE_FORMAT));
              setOpen(false);
            }}
            defaultMonth={selected || toDate || new Date()}
          />
        </div>
      ) : null}
    </div>
  );
}

"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

export type TypeaheadOption = { id: string | number; label: string };

export function Typeahead({
  value,
  onChange,
  options,
  placeholder = "Search…",
  disabled,
  id,
  "aria-label": ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  options: TypeaheadOption[];
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  "aria-label"?: string;
}) {
  const listId = useId();
  const boxRef = useRef<HTMLDivElement | null>(null);
  const selected = options.find((o) => String(o.id) === String(value));
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(selected?.label || "");

  useEffect(() => {
    if (!open) setQuery(selected?.label || "");
  }, [open, selected?.label]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const matches = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return options.slice(0, 40);
    return options
      .filter((o) => o.label.toLowerCase().includes(term))
      .slice(0, 40);
  }, [options, query]);

  return (
    <div ref={boxRef} className="ceo-typeahead">
      <input
        id={id}
        type="search"
        autoComplete="off"
        disabled={disabled}
        value={open ? query : selected?.label || ""}
        placeholder={placeholder}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-controls={listId}
        role="combobox"
        className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3.5 py-3 text-[var(--ink)] outline-none ring-[var(--accent)] focus:ring-2"
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setOpen(false);
            (e.target as HTMLInputElement).blur();
            return;
          }
          if (e.key === "Enter") {
            e.preventDefault();
            if (matches.length === 1) {
              onChange(String(matches[0].id));
              setQuery(matches[0].label);
              setOpen(false);
            }
          }
        }}
        onFocus={() => {
          setQuery(selected?.label || "");
          setOpen(true);
        }}
        onChange={(e) => {
          const next = e.target.value;
          setQuery(next);
          setOpen(true);
          if (
            !next.trim() ||
            (selected &&
              next.trim().toLowerCase() !== selected.label.toLowerCase())
          ) {
            onChange("");
          }
        }}
      />
      {open ? (
        <ul id={listId} role="listbox" className="ceo-typeahead__list">
          {matches.length ? (
            matches.map((o) => {
              const active = String(o.id) === String(value);
              return (
                <li key={String(o.id)}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    className={
                      active
                        ? "ceo-typeahead__option is-active"
                        : "ceo-typeahead__option"
                    }
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      onChange(String(o.id));
                      setQuery(o.label);
                      setOpen(false);
                    }}
                  >
                    {o.label}
                  </button>
                </li>
              );
            })
          ) : (
            <li className="ceo-typeahead__empty">No matches</li>
          )}
        </ul>
      ) : null}
    </div>
  );
}

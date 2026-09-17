"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CheckIcon } from "./Icons";

type Choice = { id: string | number; label: string };

function choiceKey(label: string) {
  return readableLabel(label).toLowerCase();
}

/** WP sometimes sends "2ndFloorParking" — keep real spaces when they exist. */
export function readableLabel(label: string) {
  const trimmed = label.trim();
  if (!trimmed) return "";
  if (/\s/.test(trimmed)) return trimmed.replace(/\s+/g, " ");
  return trimmed
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/(\d)([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2");
}

function uniqueChoices(options: Choice[]): Choice[] {
  const seen = new Set<string>();
  const out: Choice[] = [];
  for (const option of options) {
    const key = choiceKey(option.label);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push({ ...option, label: readableLabel(option.label) });
  }
  return out;
}

function idsForLabel(options: Choice[], label: string): string[] {
  const key = choiceKey(label);
  return options
    .filter((option) => choiceKey(option.label) === key)
    .map((option) => String(option.id));
}

export function ChoiceChips({
  label,
  options,
  value,
  onChange,
  placeholder = "Select…",
}: {
  label: string;
  hint?: string;
  options: Choice[];
  value: string[];
  onChange: (next: string[]) => void;
  emptyText?: string;
  placeholder?: string;
}) {
  const chips = uniqueChoices(options);
  const selected = new Set(value);
  const picked = chips.filter((option) =>
    idsForLabel(options, option.label).some((id) => selected.has(id))
  );
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const startedOnField = useRef(false);
  const listId = useId();

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

  function toggle(option: Choice) {
    const group = idsForLabel(options, option.label);
    const on = group.some((id) => selected.has(id));
    if (on) {
      onChange(value.filter((id) => !group.includes(id)));
      return;
    }
    onChange([...value, String(option.id)]);
  }

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
              aria-multiselectable="true"
              aria-label={label}
              className="ceo-menu-select__sheet"
            >
              <p className="ceo-menu-select__sheet-title">{label}</p>
              {chips.map((option) => {
                const on = idsForLabel(options, option.label).some((id) =>
                  selected.has(id)
                );
                return (
                  <button
                    key={String(option.id)}
                    type="button"
                    role="option"
                    aria-selected={on}
                    className={
                      on
                        ? "ceo-menu-select__option ceo-choice-option is-active"
                        : "ceo-menu-select__option ceo-choice-option"
                    }
                    onClick={(e) => {
                      e.stopPropagation();
                      toggle(option);
                    }}
                  >
                    <span>{option.label}</span>
                    {on ? (
                      <CheckIcon className="ceo-choice-option__check" />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <div className="space-y-1.5">
      <span className="text-sm font-medium text-[var(--muted)]">{label}</span>
      <div className="ceo-menu-select ceo-menu-select--field">
        <button
          type="button"
          className="ceo-choice-field"
          aria-label={label}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
          onPointerDown={() => {
            startedOnField.current = true;
          }}
          onClick={() => {
            if (!startedOnField.current) return;
            startedOnField.current = false;
            setOpen((v) => !v);
          }}
        >
          {picked.length ? (
            <span className="ceo-choice-field__pills">
              {picked.map((option) => (
                <span key={String(option.id)} className="ceo-choice-field__pill">
                  {option.label}
                </span>
              ))}
            </span>
          ) : (
            <span className="ceo-choice-field__value is-ph">{placeholder}</span>
          )}
        </button>
        {sheet}
      </div>
    </div>
  );
}

"use client";

import { MenuSelect } from "./MenuSelect";
import { CalendarIcon, ChevronRightIcon, FilterIcon, SearchIcon } from "./Icons";

export const DATE_RANGES = [
  { id: "7", label: "Last 7 Days", days: 7 },
  { id: "30", label: "Last 30 Days", days: 30 },
  { id: "90", label: "Last 90 Days", days: 90 },
  { id: "365", label: "Last 12 Months", days: 365 },
];

export type ClaimChoice = { id: string | number; label: string };

export type ClaimFilterField = {
  key: string;
  label: string;
  placeholder: string;
  options: ClaimChoice[];
  trailing?: boolean;
};

export function uniqueChoices(rows: ClaimChoice[]): ClaimChoice[] {
  const map = new Map<string, string>();
  for (const row of rows) {
    const id = String(row.id ?? "").trim();
    const label = String(row.label ?? "").trim();
    if (!id || id === "0" || !label) continue;
    if (!map.has(id)) map.set(id, label);
  }
  return [...map.entries()].map(([id, label]) => ({ id, label }));
}

/** Prefer the page catalog; if that is empty, use values already on the list. */
export function availableChoices(
  catalog: ClaimChoice[],
  fromItems: ClaimChoice[] = []
): ClaimChoice[] {
  const listed = uniqueChoices(catalog);
  return listed.length ? listed : uniqueChoices(fromItems);
}

export function withUnassigned(
  choices: ClaimChoice[],
  hasUnassigned: boolean
): ClaimChoice[] {
  if (!choices.length) return [];
  return hasUnassigned
    ? [{ id: "unassigned", label: "Unassigned" }, ...choices]
    : choices;
}

export function dateRangeField(key = "range"): ClaimFilterField {
  return {
    key,
    label: "Date Range",
    placeholder: "Last 30 Days",
    options: DATE_RANGES.map((range) => ({
      id: range.id,
      label: range.label,
    })),
    trailing: true,
  };
}

export function inDateRange(value: string, rangeId: string): boolean {
  if (!rangeId) return true;
  const days = DATE_RANGES.find((range) => range.id === rangeId)?.days;
  if (!days) return true;
  const raw = (value || "").trim();
  if (!raw) return true;
  const us = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  const created = us
    ? new Date(Number(us[3]), Number(us[1]) - 1, Number(us[2]))
    : new Date(raw.includes("T") ? raw : raw.replace(" ", "T"));
  if (Number.isNaN(created.getTime())) return true;
  const floor = new Date();
  floor.setDate(floor.getDate() - days);
  return created >= floor;
}

export function activeFilterCount(values: Record<string, string>): number {
  return Object.values(values).filter(Boolean).length;
}

export function ClaimSearch<T extends Record<string, string>>({
  query,
  onQuery,
  placeholder,
  ariaLabel,
  fields,
  draft,
  onDraft,
  applied,
  open,
  onOpenChange,
  onClear,
  onApply,
}: {
  query: string;
  onQuery: (value: string) => void;
  placeholder: string;
  ariaLabel: string;
  fields: ClaimFilterField[];
  draft: T;
  onDraft: (next: T) => void;
  applied: T;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClear: () => void;
  onApply: () => void;
}) {
  const active = activeFilterCount(applied);
  const visibleFields = fields.filter((field) => field.options.length > 0);

  return (
    <>
      <div className="ceo-claim-search-row">
        <label className="ceo-claim-search">
          <span className="ceo-claim-search__icon-wrap" aria-hidden>
            <SearchIcon className="ceo-claim-search__icon" />
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder={placeholder}
            aria-label={ariaLabel}
          />
        </label>
        {visibleFields.length ? (
          <button
            type="button"
            className={`ceo-claim-search__filter${open ? " is-active" : ""}`}
            aria-label="Filters"
            aria-expanded={open}
            onClick={() => onOpenChange(!open)}
          >
            <FilterIcon className="h-[18px] w-[18px]" />
            {active ? <span className="ceo-claim-search__dot" aria-hidden /> : null}
          </button>
        ) : null}
      </div>

      {open && visibleFields.length ? (
        <div className="ceo-claim-filters">
          {visibleFields.map((field) => (
            <div key={field.key} className="ceo-claim-filter">
              <span className="ceo-claim-filter__label">{field.label}</span>
              <div className="ceo-claim-filter__value">
                <MenuSelect
                  value={draft[field.key] || ""}
                  onChange={(value) =>
                    onDraft({ ...draft, [field.key]: value } as T)
                  }
                  options={field.options}
                  placeholder={field.placeholder}
                  variant="inline"
                  aria-label={field.label}
                />
                {field.trailing ? (
                  <CalendarIcon className="ceo-claim-filter__cal" />
                ) : (
                  <ChevronRightIcon className="ceo-claim-filter__chev" />
                )}
              </div>
            </div>
          ))}
          <div className="ceo-claim-filter-actions">
            <button type="button" className="ceo-btn-outline" onClick={onClear}>
              Clear
            </button>
            <button type="button" className="ceo-btn-solid" onClick={onApply}>
              Apply
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}

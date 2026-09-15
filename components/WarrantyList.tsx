"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  WarrantyChoice,
  WarrantyItem,
  WarrantyListResponse,
  WarrantyOptions,
} from "@/lib/warranties";
import { isWarrantyExpiring, isWarrantyInProgress } from "@/lib/warranties";
import { ClaimThumb, claimContactName, claimMetaLines, claimThumbSrc } from "./ClaimThumb";
import { FastLink } from "./FastLink";
import { Card } from "./ui/Card";
import { PaginatedList } from "./ui/PaginatedList";
import { StatusBadge } from "./ui/StatusBadge";
import { MenuSelect } from "./ui/MenuSelect";
import {
  CalendarIcon,
  ChevronRightIcon,
  FilterIcon,
  PlusIcon,
  SearchIcon,
} from "./ui/Icons";

type Tab = "open" | "progress" | "closed" | "assigned" | "expiring";

const TABS: { id: Tab; label: string }[] = [
  { id: "open", label: "Open" },
  { id: "progress", label: "In Progress" },
  { id: "closed", label: "Closed" },
];

const RANGES: { id: string; label: string; days: number }[] = [
  { id: "7", label: "Last 7 Days", days: 7 },
  { id: "30", label: "Last 30 Days", days: 30 },
  { id: "90", label: "Last 90 Days", days: 90 },
  { id: "365", label: "Last 12 Months", days: 365 },
];

const EMPTY_FILTERS = { type: "", status: "", range: "", assignee: "" };

type Filters = typeof EMPTY_FILTERS;

function parseTab(value?: string): Tab {
  if (
    value === "progress" ||
    value === "closed" ||
    value === "assigned" ||
    value === "expiring"
  ) {
    return value;
  }
  return "open";
}

function inRange(item: WarrantyItem, rangeId: string): boolean {
  if (!rangeId) return true;
  const days = RANGES.find((r) => r.id === rangeId)?.days;
  if (!days) return true;
  const created = new Date(item.created_date);
  if (Number.isNaN(created.getTime())) return true;
  const floor = new Date();
  floor.setDate(floor.getDate() - days);
  return created >= floor;
}

function matchesTab(item: WarrantyItem, tab: Tab, closedIds: Set<number>): boolean {
  if (tab === "closed") return closedIds.has(item.id);
  if (closedIds.has(item.id)) return false;
  if (tab === "progress") return isWarrantyInProgress(item);
  if (tab === "assigned") return Boolean(item.is_assigned);
  if (tab === "expiring") return isWarrantyExpiring(item);
  return !isWarrantyInProgress(item);
}

export function WarrantyList({
  initialTab,
  /** Set by the Vendors screen, which links here to show one vendor's claims. */
  initialAssignee,
  initialShowFilters,
}: {
  initialTab?: string;
  initialAssignee?: string;
  initialShowFilters?: boolean;
}) {
  const [tab, setTab] = useState<Tab>(() => parseTab(initialTab));
  const [openItems, setOpenItems] = useState<WarrantyItem[]>([]);
  const [closedItems, setClosedItems] = useState<WarrantyItem[]>([]);
  const [types, setTypes] = useState<WarrantyChoice[]>([]);
  const [statuses, setStatuses] = useState<WarrantyChoice[]>([]);
  const [subcontractors, setSubcontractors] = useState<WarrantyChoice[]>([]);
  const [optionsLoaded, setOptionsLoaded] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(Boolean(initialShowFilters));
  const [draft, setDraft] = useState<Filters>(EMPTY_FILTERS);
  const [filters, setFilters] = useState<Filters>(() =>
    initialAssignee ? { ...EMPTY_FILTERS, assignee: initialAssignee } : EMPTY_FILTERS
  );

  useEffect(() => {
    const t = window.setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  const load = useCallback(async (status: "open" | "closed", term: string) => {
    const params = new URLSearchParams({ status, per_page: "20" });
    if (term) params.set("search", term);
    const res = await fetch(`/api/wp/warranties?${params.toString()}`);
    const data = (await res.json()) as WarrantyListResponse & { message?: string };
    if (!res.ok) throw new Error(data.message || "Could not load warranties.");
    return data;
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    load("open", search)
      .then((open) => {
        if (cancelled) return;
        setOpenItems(open.items || []);
        setLoading(false);
        return load("closed", search);
      })
      .then((closed) => {
        if (cancelled || !closed) return;
        setClosedItems(closed.items || []);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setError(err.message || "Network error.");
        setOpenItems([]);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [load, search]);

  useEffect(() => {
    if (optionsLoaded) return;
    fetch("/api/wp/warranties/options?lite=1")
      .then((r) => r.json())
      .then((data: WarrantyOptions) => {
        setTypes(data.types || []);
        setStatuses(data.statuses || []);
        setSubcontractors(data.subcontractors || []);
        setOptionsLoaded(true);
      })
      .catch(() => undefined);
  }, [optionsLoaded]);

  const closedIds = useMemo(
    () => new Set(closedItems.map((w) => w.id)),
    [closedItems]
  );

  const all = useMemo(() => {
    const seen = new Set<number>();
    return [...openItems, ...closedItems].filter((w) => {
      if (seen.has(w.id)) return false;
      seen.add(w.id);
      return true;
    });
  }, [openItems, closedItems]);

  const filtered = useMemo(
    () =>
      all.filter((w) => {
        if (filters.type && String(w.warranty_type) !== filters.type) return false;
        if (filters.status && String(w.warranty_status) !== filters.status) {
          return false;
        }
        if (filters.assignee === "unassigned" && w.warranty_sources_subcontractors) {
          return false;
        }
        if (
          filters.assignee &&
          filters.assignee !== "unassigned" &&
          String(w.warranty_sources_subcontractors || "") !== filters.assignee
        ) {
          return false;
        }
        return inRange(w, filters.range);
      }),
    [all, filters]
  );

  const counts = useMemo(
    () => ({
      open: filtered.filter((w) => matchesTab(w, "open", closedIds)).length,
      progress: filtered.filter((w) => matchesTab(w, "progress", closedIds)).length,
      closed: filtered.filter((w) => matchesTab(w, "closed", closedIds)).length,
    }),
    [filtered, closedIds]
  );

  const visible = useMemo(
    () => filtered.filter((w) => matchesTab(w, tab, closedIds)),
    [filtered, tab, closedIds]
  );

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="space-y-4">
      <div className="ceo-claim-tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`ceo-claim-tab${tab === t.id ? " is-active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
            <span className="ceo-claim-tab__count">
              {loading ? "…" : counts[t.id as keyof typeof counts]}
            </span>
          </button>
        ))}
      </div>

      {tab === "assigned" || tab === "expiring" ? (
        <p className="text-xs font-semibold text-[var(--accent)]">
          {tab === "assigned"
            ? "Assigned to subcontractors"
            : "Expiring warranties"}
        </p>
      ) : null}

      <div className="ceo-claim-search-row">
        <label className="ceo-claim-search">
          <span className="ceo-claim-search__icon-wrap" aria-hidden>
            <SearchIcon className="ceo-claim-search__icon" />
          </span>
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search unit, name, request…"
            aria-label="Search claims"
          />
        </label>
        <button
          type="button"
          className={`ceo-claim-search__filter${showFilters ? " is-active" : ""}`}
          aria-label="Filters"
          aria-expanded={showFilters}
          onClick={() => {
            setDraft(filters);
            setShowFilters((v) => !v);
          }}
        >
          <FilterIcon className="h-[18px] w-[18px]" />
          {activeFilterCount ? (
            <span className="ceo-claim-search__dot" aria-hidden />
          ) : null}
        </button>
      </div>

      {showFilters ? (
        <div className="ceo-claim-filters">
          <FilterRow
            label="Type"
            value={draft.type}
            placeholder="All Types"
            options={types}
            onChange={(type) => setDraft((d) => ({ ...d, type }))}
          />
          <FilterRow
            label="Status"
            value={draft.status}
            placeholder="All Statuses"
            options={statuses}
            onChange={(status) => setDraft((d) => ({ ...d, status }))}
          />
          <FilterRow
            label="Date Range"
            value={draft.range}
            placeholder="Last 30 Days"
            options={RANGES.map((r) => ({ id: r.id, label: r.label }))}
            trailing
            onChange={(range) => setDraft((d) => ({ ...d, range }))}
          />
          <FilterRow
            label="Assigned To"
            value={draft.assignee}
            placeholder="All"
            options={[
              { id: "unassigned", label: "Unassigned" },
              ...subcontractors,
            ]}
            onChange={(assignee) => setDraft((d) => ({ ...d, assignee }))}
          />
          <div className="ceo-claim-filter-actions">
            <button
              type="button"
              className="ceo-btn-outline"
              onClick={() => {
                setDraft(EMPTY_FILTERS);
                setFilters(EMPTY_FILTERS);
              }}
            >
              Clear
            </button>
            <button
              type="button"
              className="ceo-btn-solid"
              onClick={() => {
                setFilters(draft);
                setShowFilters(false);
              }}
            >
              Apply
            </button>
          </div>
        </div>
      ) : null}

      {showFilters ? null : loading ? (
        <div className="space-y-3">
          <div className="ceo-skel h-[92px] rounded-2xl" />
          <div className="ceo-skel h-[92px] rounded-2xl" />
          <div className="ceo-skel h-[92px] rounded-2xl" />
        </div>
      ) : error ? (
        <Card>
          <p className="text-sm text-[var(--danger)]">{error}</p>
        </Card>
      ) : (
        <PaginatedList
          items={visible}
          pageSize={6}
          listClassName="ceo-claim-list"
          emptyMessage={
            search || activeFilterCount
              ? "No claims match your search."
              : "No claims yet."
          }
          getKey={(w) => w.id}
            renderItem={(w) => (
              <div className="ceo-list-card">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  {w.photos?.[0]?.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={w.photos[0].url}
                      alt=""
                      className="h-12 w-12 shrink-0 rounded-lg object-cover"
                    />
                  ) : null}
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[var(--accent)]">
                      #{w.id}
                    </p>
                    <p className="mt-0.5 font-semibold">
                      {w.warranty_describe_the_request ||
                        w.warranty_describe_the_request_single ||
                        w.unit_title ||
                        "Warranty claim"}
                    </p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {[
                        w.location_labels,
                        w.unit_title,
                        w.resident_name ||
                          [w.warranty_first_name, w.warranty_last_name]
                            .filter(Boolean)
                            .join(" "),
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    {isStaff && w.status_label ? (
                      <div className="mt-2">
                        <StatusBadge label={w.status_label} />
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
              <StatusBadge label={w.status_label} short />
            </Link>
            );
          }}
        />
      )}

      {showFilters ? null : (
        <FastLink href="/account/warranties/new" className="ceo-fab">
          <PlusIcon className="h-4 w-4" />
          New Claim
        </FastLink>
      )}
    </div>
  );
}

      {canCreate ? (
        <Link href="/account/warranties/new" className="ceo-fab">
          + New Warranty
        </Link>
      ) : null}
    </div>
  );
}

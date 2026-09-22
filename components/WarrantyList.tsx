"use client";

import { useEffect, useMemo, useState } from "react";
import type { WarrantyChoice, WarrantyItem } from "@/lib/warranties";
import {
  isWarrantyClosed,
  isWarrantyExpiring,
  isWarrantyInProgress,
} from "@/lib/warranties";
import { loadWarrantyClaims, loadWarrantyOptions } from "@/lib/helpers/warranties";
import { ClaimThumb, claimContactName, claimMetaLines, claimThumbSrc } from "./ClaimThumb";
import { FastLink } from "./FastLink";
import { PaginatedList } from "./ui/PaginatedList";
import { StatusBadge } from "./ui/StatusBadge";
import {
  ClaimSearch,
  availableChoices,
  dateRangeField,
  inDateRange,
  withUnassigned,
} from "./ui/ClaimSearch";
import { PlusIcon } from "./ui/Icons";

type Tab = "open" | "progress" | "closed" | "assigned" | "expiring";

const TABS: { id: Tab; label: string }[] = [
  { id: "open", label: "Open" },
  { id: "progress", label: "In Progress" },
  { id: "closed", label: "Closed" },
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
  return inDateRange(item.created_date, rangeId);
}

function matchesTab(item: WarrantyItem, tab: Tab): boolean {
  const closed = isWarrantyClosed(item);
  if (tab === "closed") return closed;
  if (closed) return false;
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

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      loadWarrantyClaims("open", { search, perPage: 50 }),
      loadWarrantyClaims("closed", { search, perPage: 50 }),
    ])
      .then(([open, closed]) => {
        if (cancelled) return;
        setOpenItems(open.items);
        setClosedItems(closed.items);
      })
      .catch(() => {
        if (cancelled) return;
        setOpenItems([]);
        setClosedItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [search]);

  useEffect(() => {
    if (optionsLoaded) return;
    loadWarrantyOptions()
      .then((data) => {
        if (!data) return;
        setTypes(data.types || []);
        setStatuses(data.statuses || []);
        setSubcontractors(data.subcontractors || []);
        setOptionsLoaded(true);
      })
      .catch(() => undefined);
  }, [optionsLoaded]);

  const all = useMemo(() => {
    const seen = new Set<number>();
    return [...openItems, ...closedItems].filter((w) => {
      if (seen.has(w.id)) return false;
      seen.add(w.id);
      return true;
    });
  }, [openItems, closedItems]);

  const typeOptions = useMemo(
    () =>
      availableChoices(
        types,
        all.map((item) => ({
          id: item.warranty_type,
          label: item.type_label,
        }))
      ),
    [types, all]
  );
  const statusOptions = useMemo(
    () =>
      availableChoices(
        statuses,
        all.map((item) => ({
          id: item.warranty_status,
          label: item.status_label,
        }))
      ),
    [statuses, all]
  );
  const assigneeOptions = useMemo(
    () =>
      withUnassigned(
        availableChoices(
          subcontractors,
          all.map((item) => ({
            id: item.warranty_sources_subcontractors || "",
            label: item.subcontractor_name || "",
          }))
        ),
        all.some((item) => !item.warranty_sources_subcontractors)
      ),
    [subcontractors, all]
  );
  const filterFields = useMemo(
    () => [
      ...(typeOptions.length
        ? [{ key: "type", label: "Type", placeholder: "All Types", options: typeOptions }]
        : []),
      ...(statusOptions.length
        ? [
            {
              key: "status",
              label: "Status",
              placeholder: "All Statuses",
              options: statusOptions,
            },
          ]
        : []),
      dateRangeField(),
      ...(assigneeOptions.length
        ? [
            {
              key: "assignee",
              label: "Assigned To",
              placeholder: "All",
              options: assigneeOptions,
            },
          ]
        : []),
    ],
    [typeOptions, statusOptions, assigneeOptions]
  );

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
      open: filtered.filter((w) => matchesTab(w, "open")).length,
      progress: filtered.filter((w) => matchesTab(w, "progress")).length,
      closed: filtered.filter((w) => matchesTab(w, "closed")).length,
    }),
    [filtered]
  );

  const visible = useMemo(
    () => filtered.filter((w) => matchesTab(w, tab)),
    [filtered, tab]
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

      <ClaimSearch
        query={searchInput}
        onQuery={setSearchInput}
        placeholder="Search unit, name, request…"
        ariaLabel="Search claims"
        fields={filterFields}
        draft={draft}
        onDraft={setDraft}
        applied={filters}
        open={showFilters}
        onOpenChange={(next) => {
          if (next) setDraft(filters);
          setShowFilters(next);
        }}
        onClear={() => {
          setDraft(EMPTY_FILTERS);
          setFilters(EMPTY_FILTERS);
        }}
        onApply={() => {
          setFilters(draft);
          setShowFilters(false);
        }}
      />

      {showFilters ? null : loading ? (
        <div className="space-y-3">
          <div className="ceo-skel h-[92px] rounded-2xl" />
          <div className="ceo-skel h-[92px] rounded-2xl" />
          <div className="ceo-skel h-[92px] rounded-2xl" />
        </div>
      ) : (
        <PaginatedList
          items={visible}
          pageSize={6}
          listClassName="ceo-claim-list"
          emptyIcon={search || activeFilterCount ? "search" : "inbox"}
          emptyMessage={
            search || activeFilterCount
              ? "No matching claims"
              : "No claims yet"
          }
          emptySubtitle={
            search || activeFilterCount
              ? "Try another search or filter."
              : "New claims will show up here."
          }
          getKey={(w) => w.id}
          renderItem={(w) => {
            const title =
              w.warranty_describe_the_request ||
              w.warranty_describe_the_request_single ||
              w.unit_title ||
              "Warranty claim";
            const contact = claimContactName(w);
            const meta = claimMetaLines(w, title);
            return (
              <FastLink
                href={`/account/warranties/${w.id}`}
                className="ceo-claim-card"
              >
                <ClaimThumb src={claimThumbSrc(w)} name={contact} />
                <div className="min-w-0 flex-1">
                  <p className="ceo-claim-card__id">#{w.id}</p>
                  <p className="ceo-claim-card__title">{title}</p>
                  {meta.length ? (
                    <div className="ceo-claim-card__meta">
                      {meta.map((line, i) => (
                        <span key={`${i}-${line}`}>{line}</span>
                      ))}
                    </div>
                  ) : null}
                </div>
                {w.status_label ? (
                  <StatusBadge label={w.status_label} short />
                ) : null}
              </FastLink>
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

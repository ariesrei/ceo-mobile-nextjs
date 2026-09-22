"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { MaintenanceChoice, MaintenanceItem } from "@/lib/maintenance";
import {
  listMaintenance,
  loadMaintenanceOptions,
  updateMaintenanceStatus,
} from "@/lib/helpers/maintenance";
import { ClaimThumb } from "./ClaimThumb";
import { Card } from "./ui/Card";
import {
  ClaimSearch,
  activeFilterCount,
  availableChoices,
  dateRangeField,
  inDateRange,
  withUnassigned,
} from "./ui/ClaimSearch";
import { PaginatedList } from "./ui/PaginatedList";
import { StatusBadge } from "./ui/StatusBadge";
import { MenuSelect } from "./ui/MenuSelect";
import { PlusIcon } from "./ui/Icons";

type Tab = "internal" | "external" | "completed" | "open";

const EMPTY_FILTERS = { type: "", status: "", range: "", assignee: "" };

export function MaintenanceList() {
  const [status, setStatus] = useState<Tab>("open");
  const [items, setItems] = useState<MaintenanceItem[]>([]);
  const [canEdit, setCanEdit] = useState(false);
  const [showCompletedTab, setShowCompletedTab] = useState(false);
  const [isStaff, setIsStaff] = useState(true);
  const [types, setTypes] = useState<MaintenanceChoice[]>([]);
  const [statuses, setStatuses] = useState<MaintenanceChoice[]>([]);
  const [staff, setStaff] = useState<MaintenanceChoice[]>([]);
  const [subcontractors, setSubcontractors] = useState<MaintenanceChoice[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [draft, setDraft] = useState(EMPTY_FILTERS);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [reloadKey, setReloadKey] = useState(0);
  const [statusModalId, setStatusModalId] = useState<number | null>(null);
  const [statusValue, setStatusValue] = useState("");
  const [savingStatus, setSavingStatus] = useState(false);
  const [statusError, setStatusError] = useState("");

  useEffect(() => {
    const t = window.setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  const loadList = useCallback(() => {
    setLoading(true);
    setError("");
    listMaintenance({ status, search })
      .then((data) => {
        if (!data.ok) {
          setError(data.message || "Could not load maintenance.");
          setItems([]);
          return;
        }
        setItems(data.items);
        setCanEdit(data.can_edit);
        setShowCompletedTab(data.show_completed_tab);
        setIsStaff(data.is_staff);
        if (!data.is_staff && (status === "internal" || status === "external")) {
          setStatus("open");
        } else if (!data.show_completed_tab && status === "completed") {
          setStatus(data.is_staff ? "internal" : "open");
        }
      })
      .finally(() => setLoading(false));
  }, [status, search]);

  useEffect(() => {
    loadList();
  }, [loadList, reloadKey]);

  useEffect(() => {
    loadMaintenanceOptions().then((data) => {
      if (!data) return;
      setTypes(data.types || []);
      setStatuses(data.statuses || []);
      setStaff(data.staff || []);
      setSubcontractors(data.subcontractors || []);
      if (typeof data.show_completed_tab === "boolean") {
        setShowCompletedTab(data.show_completed_tab);
      }
      if (typeof data.is_staff === "boolean") {
        setIsStaff(data.is_staff);
      }
    });
  }, []);

  async function confirmStatus() {
    if (!statusModalId || !statusValue) return;
    setSavingStatus(true);
    setStatusError("");
    try {
      const data = await updateMaintenanceStatus(
        statusModalId,
        Number(statusValue)
      );
      if (!data.ok) {
        setStatusError(data.message);
        return;
      }
      setStatusModalId(null);
      setReloadKey((k) => k + 1);
    } finally {
      setSavingStatus(false);
    }
  }

  const tabs: { id: Tab; label: string }[] = isStaff
    ? [
        { id: "internal", label: "Internal" },
        { id: "external", label: "External" },
        ...(showCompletedTab
          ? [{ id: "completed" as const, label: "Completed" }]
          : []),
      ]
    : [
        { id: "open", label: "Open" },
        ...(showCompletedTab
          ? [{ id: "completed" as const, label: "Completed" }]
          : []),
      ];

  const typeOptions = useMemo(
    () =>
      availableChoices(
        types,
        items.map((item) => ({
          id: item.maintenance_type,
          label: item.type_label,
        }))
      ),
    [types, items]
  );
  const statusOptions = useMemo(
    () =>
      availableChoices(
        statuses,
        items.map((item) => ({
          id: item.maintenance_status,
          label: item.status_label,
        }))
      ),
    [statuses, items]
  );
  const assigneeOptions = useMemo(
    () =>
      withUnassigned(
        availableChoices(
          [...staff, ...subcontractors],
          items.flatMap((item) => [
            { id: item.maintenance_assigned_person, label: item.assigned_name },
            {
              id: item.maintenance_sources_subcontractors || "",
              label: item.subcontractor_name || "",
            },
          ])
        ),
        items.some(
          (item) =>
            !item.maintenance_assigned_person &&
            !item.maintenance_sources_subcontractors
        )
      ),
    [staff, subcontractors, items]
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

  const visible = useMemo(
    () =>
      items.filter((item) => {
        if (filters.type && String(item.maintenance_type) !== filters.type) {
          return false;
        }
        if (filters.status && String(item.maintenance_status) !== filters.status) {
          return false;
        }
        if (filters.assignee === "unassigned" && item.maintenance_assigned_person) {
          return false;
        }
        if (
          filters.assignee &&
          filters.assignee !== "unassigned" &&
          String(item.maintenance_assigned_person || "") !== filters.assignee &&
          String(item.maintenance_sources_subcontractors || "") !== filters.assignee
        ) {
          return false;
        }
        return inDateRange(item.maintenance_date_request, filters.range);
      }),
    [items, filters]
  );
  const filterCount = activeFilterCount(filters);

  return (
    <div className="space-y-4">
      <div className="ceo-claim-tabs">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`ceo-claim-tab${status === t.id ? " is-active" : ""}`}
            onClick={() => setStatus(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <ClaimSearch
        query={searchInput}
        onQuery={setSearchInput}
        placeholder="Search unit, name, request…"
        ariaLabel="Search maintenance"
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
        </div>
      ) : error ? (
        <Card>
          <p className="text-sm text-[var(--danger)]">{error}</p>
        </Card>
      ) : (
        <PaginatedList
          items={visible}
          listClassName="ceo-claim-list"
          emptyIcon={search || filterCount ? "search" : "inbox"}
          emptyMessage={
            search || filterCount ? "No matching requests" : "No work orders yet"
          }
          emptySubtitle={
            search || filterCount
              ? "Try another search or filter."
              : "Submit a request when something needs attention."
          }
          getKey={(m) => m.id}
          renderItem={(m) => (
            <div className="ceo-claim-card">
              <ClaimThumb
                src={m.photos?.[0]?.url}
                name={m.request_by_name || m.type_label || m.unit_title}
              />
              <div className="min-w-0 flex-1">
                <p className="ceo-claim-card__title">
                  {m.maintenance_description || m.type_label || "Work order"}
                </p>
                <div className="ceo-claim-card__meta">
                  <span>
                    {[
                      m.type_label,
                      m.unit_title ? `#${m.unit_title}` : "",
                      m.maintenance_date_request,
                      m.assigned_name,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <StatusBadge label={m.status_label} short />
                {canEdit ? (
                  <>
                    <button
                      type="button"
                      className="text-xs font-semibold text-[var(--accent)]"
                      onClick={() => {
                        setStatusError("");
                        setStatusValue(
                          m.maintenance_status
                            ? String(m.maintenance_status)
                            : statuses[0]
                              ? String(statuses[0].id)
                              : ""
                        );
                        setStatusModalId(m.id);
                      }}
                    >
                      Status
                    </button>
                    <Link
                      href={`/account/maintenance/${m.id}/edit`}
                      className="text-xs font-semibold text-[var(--accent)]"
                    >
                      Edit
                    </Link>
                  </>
                ) : null}
              </div>
            </div>
          )}
        />
      )}

      {statusModalId ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setStatusModalId(null);
          }}
        >
          <div className="w-full max-w-md space-y-4 rounded-2xl bg-[var(--surface)] p-4">
            <h2 className="font-display text-lg font-semibold">Update status</h2>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-[var(--muted)]">
                Status
              </span>
              <MenuSelect
                variant="field"
                aria-label="Status"
                value={statusValue}
                options={statuses.map((s) => ({
                  id: s.id,
                  label: s.label,
                }))}
                disabled={savingStatus}
                onChange={setStatusValue}
              />
            </label>
            {statusError ? (
              <p className="rounded-xl bg-[#3a1c1c] px-3 py-2 text-sm text-[var(--danger)]">
                {statusError}
              </p>
            ) : null}
            <div className="flex gap-2">
              <button
                type="button"
                className="flex-1 rounded-xl border border-[var(--border)] px-3 py-3 text-sm font-semibold"
                disabled={savingStatus}
                onClick={() => setStatusModalId(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="ceo-btn-accent flex-1 rounded-xl bg-[var(--accent)] px-3 py-3 text-sm font-semibold text-[#081014] disabled:opacity-60"
                disabled={savingStatus || !statusValue}
                onClick={confirmStatus}
              >
                {savingStatus ? "Saving…" : "Save status"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showFilters || !canEdit ? null : (
        <Link href="/account/maintenance/new" className="ceo-fab">
          <PlusIcon className="h-4 w-4" />
          New request
        </Link>
      )}
    </div>
  );
}

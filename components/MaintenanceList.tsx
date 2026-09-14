"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type {
  MaintenanceItem,
  MaintenanceListResponse,
  MaintenanceOptions,
} from "@/lib/maintenance";
import { Card } from "./ui/Card";
import { PaginatedList } from "./ui/PaginatedList";
import { StatusBadge } from "./ui/StatusBadge";

type Tab = "internal" | "external" | "completed";

export function MaintenanceList() {
  const [status, setStatus] = useState<Tab>("internal");
  const [items, setItems] = useState<MaintenanceItem[]>([]);
  const [canEdit, setCanEdit] = useState(false);
  const [showCompletedTab, setShowCompletedTab] = useState(false);
  const [statuses, setStatuses] = useState<{ id: number; label: string }[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
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
    const params = new URLSearchParams({
      status,
      per_page: "50",
    });
    if (search) params.set("search", search);
    fetch(`/api/wp/maintenance?${params.toString()}`)
      .then(async (r) => {
        const data = (await r.json()) as MaintenanceListResponse & {
          message?: string;
        };
        if (!r.ok) {
          setError(data.message || "Could not load maintenance.");
          setItems([]);
          return;
        }
        setItems(data.items || []);
        setCanEdit(Boolean(data.can_edit));
        if (typeof data.show_completed_tab === "boolean") {
          setShowCompletedTab(data.show_completed_tab);
          if (!data.show_completed_tab && status === "completed") {
            setStatus("internal");
          }
        }
      })
      .catch(() => {
        setError("Network error.");
        setItems([]);
      })
      .finally(() => setLoading(false));
  }, [status, search]);

  useEffect(() => {
    loadList();
  }, [loadList, reloadKey]);

  useEffect(() => {
    fetch("/api/wp/maintenance/options")
      .then((r) => r.json())
      .then((data: MaintenanceOptions) => {
        setStatuses(data.statuses || []);
        if (typeof data.show_completed_tab === "boolean") {
          setShowCompletedTab(data.show_completed_tab);
        }
      })
      .catch(() => undefined);
  }, []);

  async function confirmStatus() {
    if (!statusModalId || !statusValue) return;
    setSavingStatus(true);
    setStatusError("");
    try {
      const res = await fetch(`/api/wp/maintenance/${statusModalId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maintenance_status: Number(statusValue) }),
      });
      const data = (await res.json()) as { message?: string };
      if (!res.ok) {
        setStatusError(data.message || "Could not update status.");
        return;
      }
      setStatusModalId(null);
      setReloadKey((k) => k + 1);
    } catch {
      setStatusError("Network error.");
    } finally {
      setSavingStatus(false);
    }
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "internal", label: "Internal" },
    { id: "external", label: "External" },
    ...(showCompletedTab
      ? [{ id: "completed" as const, label: "Completed" }]
      : []),
  ];

  return (
    <div className="space-y-4">
      <div className="ceo-toolbar">
        <div className="ceo-tabs">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              className={status === t.id ? "is-active" : ""}
              onClick={() => setStatus(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <label className="block">
          <span className="sr-only">Search maintenance</span>
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search unit, type, description…"
            className="ceo-search"
          />
        </label>
      </div>

      {loading ? (
        <Card>
          <p className="text-sm text-[var(--muted)]">Loading maintenance…</p>
        </Card>
      ) : error ? (
        <Card>
          <p className="text-sm text-[var(--danger)]">{error}</p>
        </Card>
      ) : (
        <PaginatedList
          items={items}
          pageSize={5}
          emptyMessage={
            search
              ? "No maintenance records match your search."
              : "No maintenance records."
          }
          getKey={(m) => m.id}
            renderItem={(m) => (
              <div className="ceo-list-card">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  {m.photos?.[0]?.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={m.photos[0].url}
                      alt=""
                      className="h-12 w-12 shrink-0 rounded-lg object-cover"
                    />
                  ) : null}
                  <div className="min-w-0">
                    <p className="font-semibold">
                      {m.maintenance_description ||
                        m.type_label ||
                        "Work order"}
                    </p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {[
                        m.unit_title ? `#${m.unit_title}` : "",
                        m.maintenance_date_request,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <StatusBadge label={m.status_label} />
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
        >
          <div className="w-full max-w-md space-y-4 rounded-2xl bg-[var(--surface)] p-4">
            <h2 className="font-display text-lg font-semibold">Update status</h2>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-[var(--muted)]">
                Status
              </span>
              <select
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3.5 py-3 text-sm outline-none ring-[var(--accent)] focus:ring-2"
                value={statusValue}
                onChange={(e) => setStatusValue(e.target.value)}
                disabled={savingStatus}
              >
                {statuses.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
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

      {canEdit ? (
        <Link href="/account/maintenance/new" className="ceo-fab">
          + New request
        </Link>
      ) : null}
    </div>
  );
}

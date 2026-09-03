"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type {
  WarrantyItem,
  WarrantyListResponse,
  WarrantyOptions,
} from "@/lib/warranties";
import { Card } from "./ui/Card";
import { PaginatedList } from "./ui/PaginatedList";
import { StatusBadge } from "./ui/StatusBadge";

type Tab = "open" | "closed";

export function WarrantyList() {
  const [status, setStatus] = useState<Tab>("open");
  const [items, setItems] = useState<WarrantyItem[]>([]);
  const [canEdit, setCanEdit] = useState(false);
  const [canCreate, setCanCreate] = useState(false);
  const [isStaff, setIsStaff] = useState(false);
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
    fetch(`/api/wp/warranties?${params.toString()}`)
      .then(async (r) => {
        const data = (await r.json()) as WarrantyListResponse & {
          message?: string;
        };
        if (!r.ok) {
          setError(data.message || "Could not load warranties.");
          setItems([]);
          return;
        }
        setItems(data.items || []);
        setCanEdit(Boolean(data.can_edit));
        setCanCreate(Boolean(data.can_create));
        setIsStaff(Boolean(data.is_staff));
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
    fetch("/api/wp/warranties/options")
      .then((r) => r.json())
      .then((data: WarrantyOptions) => {
        setStatuses(
          (data.statuses || []).map((s) => ({
            id: Number(s.id),
            label: s.label,
          }))
        );
        setCanEdit(Boolean(data.can_edit));
        setCanCreate(Boolean(data.can_create));
        setIsStaff(Boolean(data.is_staff));
      })
      .catch(() => undefined);
  }, []);

  async function confirmStatus() {
    if (!statusModalId || !statusValue) return;
    setSavingStatus(true);
    setStatusError("");
    try {
      const res = await fetch(`/api/wp/warranties/${statusModalId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ warranty_status: Number(statusValue) }),
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

  return (
    <div className="space-y-4">
      <div className="ceo-toolbar">
        {isStaff ? (
          <div className="ceo-tabs">
            {(
              [
                { id: "open", label: "Active" },
                { id: "closed", label: "Past" },
              ] as const
            ).map((t) => (
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
        ) : (
          <p className="text-sm text-[var(--muted)]">Active and past claims</p>
        )}

        <label className="block">
          <span className="sr-only">Search warranties</span>
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search unit, name, request…"
            className="ceo-search"
          />
        </label>
      </div>

      {loading ? (
        <Card>
          <p className="text-sm text-[var(--muted)]">Loading warranties…</p>
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
              ? "No warranties match your search."
              : "No warranties yet."
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
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  {canEdit ? (
                    <>
                      {isStaff ? (
                        <>
                          {!w.is_assigned && !w.warranty_sources_subcontractors ? (
                            <Link
                              href={`/account/warranties/${w.id}/assign`}
                              className="text-xs font-semibold text-[var(--accent)]"
                            >
                              Assign Subcontractor
                            </Link>
                          ) : null}
                          <button
                            type="button"
                            className="text-xs font-semibold text-[var(--accent)]"
                            onClick={() => {
                              setStatusError("");
                              setStatusValue(
                                w.warranty_status
                                  ? String(w.warranty_status)
                                  : statuses[0]
                                    ? String(statuses[0].id)
                                    : ""
                              );
                              setStatusModalId(w.id);
                            }}
                          >
                            Update Status
                          </button>
                        </>
                      ) : null}
                      <Link
                        href={`/account/warranties/${w.id}/edit`}
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
            <h2 className="font-display text-lg font-semibold">Update Status</h2>
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
                {savingStatus ? "Saving…" : "Update Status"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {canCreate ? (
        <Link href="/account/warranties/new" className="ceo-fab">
          {isStaff ? "+ New ticket" : "+ New claim"}
        </Link>
      ) : null}
    </div>
  );
}

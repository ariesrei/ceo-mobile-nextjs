"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { ParcelItem, ParcelListResponse, ParcelOptions } from "@/lib/parcels";
import { Card } from "./ui/Card";
import { PaginatedList } from "./ui/PaginatedList";
import { StatusBadge } from "./ui/StatusBadge";

/** Set true later to show Claimed history tab again. */
const SHOW_CLAIMED_TAB = false;

export function ParcelsList() {
  const [status, setStatus] = useState<"storage" | "claimed">("storage");
  const [items, setItems] = useState<ParcelItem[]>([]);
  const [canEdit, setCanEdit] = useState(false);
  const [pickupTypes, setPickupTypes] = useState<string[]>(["Quick Signout"]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [signoutId, setSignoutId] = useState<number | null>(null);
  const [pickupType, setPickupType] = useState("Quick Signout");
  const [signingOut, setSigningOut] = useState(false);
  const [signoutError, setSignoutError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const activeStatus = SHOW_CLAIMED_TAB ? status : "storage";

  useEffect(() => {
    const t = window.setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  const loadList = useCallback(() => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({
      status: activeStatus,
      per_page: "50",
    });
    if (search) {
      params.set("search", search);
    }
    fetch(`/api/wp/parcels?${params.toString()}`)
      .then(async (r) => {
        const data = (await r.json()) as ParcelListResponse & {
          message?: string;
        };
        if (!r.ok) {
          setError(data.message || "Could not load parcels.");
          setItems([]);
          return;
        }
        setItems(data.items || []);
        setCanEdit(Boolean(data.can_edit));
      })
      .catch(() => {
        setError("Network error.");
        setItems([]);
      })
      .finally(() => setLoading(false));
  }, [activeStatus, search]);

  useEffect(() => {
    loadList();
  }, [loadList, reloadKey]);

  useEffect(() => {
    fetch("/api/wp/parcels/options")
      .then((r) => r.json())
      .then((data: ParcelOptions) => {
        if (data.pickup_types?.length) {
          setPickupTypes(data.pickup_types);
          setPickupType((prev) =>
            data.pickup_types!.includes(prev) ? prev : data.pickup_types![0]
          );
        }
      })
      .catch(() => undefined);
  }, []);

  async function confirmSignout() {
    if (!signoutId) return;
    setSigningOut(true);
    setSignoutError("");
    try {
      const res = await fetch(`/api/wp/parcels/${signoutId}/signout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parcel_pickup_type: pickupType }),
      });
      const data = (await res.json()) as { message?: string };
      if (!res.ok) {
        setSignoutError(data.message || "Could not sign out parcel.");
        return;
      }
      setSignoutId(null);
      setReloadKey((k) => k + 1);
    } catch {
      setSignoutError("Network error.");
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="ceo-toolbar">
        {SHOW_CLAIMED_TAB ? (
          <div className="ceo-tabs">
            <button
              type="button"
              className={status === "storage" ? "is-active" : ""}
              onClick={() => setStatus("storage")}
            >
              In storage
            </button>
            <button
              type="button"
              className={status === "claimed" ? "is-active" : ""}
              onClick={() => setStatus("claimed")}
            >
              Claimed
            </button>
          </div>
        ) : null}

        <label className="block">
          <span className="sr-only">Search parcels</span>
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search unit, resident, barcode…"
            className="ceo-search"
          />
        </label>
      </div>

      {loading ? (
        <Card>
          <p className="text-sm text-[var(--muted)]">Loading parcels…</p>
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
              ? "No parcels match your search."
              : activeStatus === "storage"
                ? "No parcels in storage."
                : "No claimed parcels."
          }
          getKey={(p) => p.id}
            renderItem={(p) => (
              <div className="ceo-list-card">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  {p.photos?.[0]?.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.photos[0].url}
                      alt=""
                      className="h-12 w-12 shrink-0 rounded-lg object-cover"
                    />
                  ) : null}
                  <div className="min-w-0">
                    <p className="font-semibold">
                      {p.resident_name || "Resident"}
                    </p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {[
                        p.unit_title,
                        p.parcel_type_label || p.parcel_type_other,
                        p.parcel_delivered_on,
                        p.parcel_number > 1 ? `×${p.parcel_number}` : "",
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <StatusBadge
                    label={
                      p.status === "in_storage" || !p.parcel_pickup_type
                        ? "In storage"
                        : "Claimed"
                    }
                  />
                  {canEdit ? (
                    <>
                      {p.status === "in_storage" || !p.parcel_pickup_type ? (
                        <button
                          type="button"
                          className="text-xs font-semibold text-[var(--accent)]"
                          onClick={() => {
                            setSignoutError("");
                            setPickupType(
                              pickupTypes.includes("Quick Signout")
                                ? "Quick Signout"
                                : pickupTypes[0] || "Quick Signout"
                            );
                            setSignoutId(p.id);
                          }}
                        >
                          Sign out
                        </button>
                      ) : null}
                      <Link
                        href={`/account/parcels/${p.id}/edit`}
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

      {signoutId ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="parcel-signout-title"
        >
          <div className="w-full max-w-md space-y-4 rounded-2xl bg-[var(--surface)] p-4">
            <h2
              id="parcel-signout-title"
              className="font-display text-lg font-semibold"
            >
              Quick Signout
            </h2>
            <p className="text-sm text-[var(--muted)]">
              Mark this parcel as claimed / signed out. It will leave In storage.
            </p>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-[var(--muted)]">
                Pickup type
              </span>
              <select
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3.5 py-3 text-sm outline-none ring-[var(--accent)] focus:ring-2"
                value={pickupType}
                onChange={(e) => setPickupType(e.target.value)}
                disabled={signingOut}
              >
                {pickupTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            {signoutError ? (
              <p className="rounded-xl bg-[#3a1c1c] px-3 py-2 text-sm text-[var(--danger)]">
                {signoutError}
              </p>
            ) : null}
            <div className="flex gap-2">
              <button
                type="button"
                className="flex-1 rounded-xl border border-[var(--border)] px-3 py-3 text-sm font-semibold"
                disabled={signingOut}
                onClick={() => setSignoutId(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="ceo-btn-accent flex-1 rounded-xl bg-[var(--accent)] px-3 py-3 text-sm font-semibold text-[#081014] disabled:opacity-60"
                disabled={signingOut}
                onClick={confirmSignout}
              >
                {signingOut ? "Signing out…" : "Confirm Quick Signout"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {canEdit ? (
        <Link href="/account/parcels/new" className="ceo-fab">
          + New parcel
        </Link>
      ) : null}
    </div>
  );
}

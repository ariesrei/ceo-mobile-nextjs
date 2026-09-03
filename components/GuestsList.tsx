"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { GuestItem, GuestListResponse } from "@/lib/guests";
import { Card } from "./ui/Card";
import { PaginatedList } from "./ui/PaginatedList";

type Tab = "checked_in" | "checked_out";

export function GuestsList() {
  const [status, setStatus] = useState<Tab>("checked_in");
  const [items, setItems] = useState<GuestItem[]>([]);
  const [canEdit, setCanEdit] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [checkoutId, setCheckoutId] = useState<number | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");

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
    fetch(`/api/wp/guests?${params.toString()}`)
      .then(async (r) => {
        const data = (await r.json()) as GuestListResponse & {
          message?: string;
        };
        if (!r.ok) {
          setError(data.message || "Could not load guests.");
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
  }, [status, search]);

  useEffect(() => {
    loadList();
  }, [loadList, reloadKey]);

  async function confirmCheckout() {
    if (!checkoutId) return;
    setCheckingOut(true);
    setCheckoutError("");
    try {
      const res = await fetch(`/api/wp/guests/${checkoutId}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      const data = (await res.json()) as { message?: string };
      if (!res.ok) {
        setCheckoutError(data.message || "Could not check out guest.");
        return;
      }
      setCheckoutId(null);
      setReloadKey((k) => k + 1);
    } catch {
      setCheckoutError("Network error.");
    } finally {
      setCheckingOut(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex rounded-xl border border-[var(--border)] bg-white p-1">
          <button
            type="button"
            className={`rounded-lg px-3 py-2 text-sm font-semibold ${
              status === "checked_in"
                ? "bg-[var(--accent)] text-white"
                : "text-[var(--muted)]"
            }`}
            onClick={() => setStatus("checked_in")}
          >
            Checked in
          </button>
          <button
            type="button"
            className={`rounded-lg px-3 py-2 text-sm font-semibold ${
              status === "checked_out"
                ? "bg-[var(--accent)] text-white"
                : "text-[var(--muted)]"
            }`}
            onClick={() => setStatus("checked_out")}
          >
            Checked out
          </button>
        </div>
        {canEdit ? (
          <Link
            href="/account/guests/new"
            className="ceo-btn-accent rounded-lg bg-[var(--accent)] px-3 py-2 text-sm font-semibold text-white"
          >
            New guest
          </Link>
        ) : null}
      </div>

      <label className="block space-y-1.5">
        <span className="sr-only">Search guests</span>
        <input
          type="search"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search name, unit, phone, plate…"
          className="w-full rounded-xl border border-[var(--border)] bg-white px-3.5 py-3 text-sm text-[var(--ink)] outline-none ring-[var(--accent)] focus:ring-2"
        />
      </label>

      {loading ? (
        <Card>
          <p className="text-sm text-[var(--muted)]">Loading guests…</p>
        </Card>
      ) : error ? (
        <Card>
          <p className="text-sm text-red-700">{error}</p>
        </Card>
      ) : (
        <Card>
          <PaginatedList
            items={items}
            pageSize={5}
            emptyMessage={
              search
                ? "No guests match your search."
                : status === "checked_in"
                  ? "No guests currently checked in."
                  : "No checked-out guests."
            }
            getKey={(g) => g.id}
            renderItem={(g) => (
              <div className="flex items-start justify-between gap-3 rounded-xl bg-[var(--surface-2)] p-3">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  {g.photos?.[0]?.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={g.photos[0].url}
                      alt=""
                      className="h-12 w-12 shrink-0 rounded-lg object-cover"
                    />
                  ) : null}
                  <div className="min-w-0">
                    <p className="font-medium">
                      {g.guest_names || g.title || "Guest"} ·{" "}
                      {g.unit_title || "Unit"}
                    </p>
                    <p className="text-sm text-[var(--muted)]">
                      {[
                        g.guest_phone,
                        g.guest_number > 1 ? `×${g.guest_number}` : "",
                        g.guest_check_in,
                        g.guest_license_plate,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                </div>
                {canEdit ? (
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    {status === "checked_in" && !g.guest_check_out ? (
                      <button
                        type="button"
                        className="text-sm font-semibold text-[var(--accent)]"
                        onClick={() => {
                          setCheckoutError("");
                          setCheckoutId(g.id);
                        }}
                      >
                        Check out
                      </button>
                    ) : null}
                    <Link
                      href={`/account/guests/${g.id}/edit`}
                      className="text-sm font-semibold text-[var(--accent)]"
                    >
                      Edit
                    </Link>
                  </div>
                ) : null}
              </div>
            )}
          />
        </Card>
      )}

      {checkoutId ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="guest-checkout-title"
        >
          <div className="w-full max-w-md space-y-4 rounded-2xl bg-white p-4 shadow-lg">
            <h2
              id="guest-checkout-title"
              className="font-display text-lg font-semibold"
            >
              Check out guest
            </h2>
            <p className="text-sm text-[var(--muted)]">
              Set Check Out to now and move this visit to Checked out.
            </p>
            {checkoutError ? (
              <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
                {checkoutError}
              </p>
            ) : null}
            <div className="flex gap-2">
              <button
                type="button"
                className="flex-1 rounded-xl border border-[var(--border)] px-3 py-3 text-sm font-semibold"
                disabled={checkingOut}
                onClick={() => setCheckoutId(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="ceo-btn-accent flex-1 rounded-xl bg-[var(--accent)] px-3 py-3 text-sm font-semibold text-white disabled:opacity-60"
                disabled={checkingOut}
                onClick={confirmCheckout}
              >
                {checkingOut ? "Checking out…" : "Confirm check out"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

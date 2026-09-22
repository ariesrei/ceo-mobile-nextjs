"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { GuestChoice, GuestItem } from "@/lib/guests";
import {
  checkoutGuest,
  countGuests,
  listGuests,
  loadGuestOptions,
} from "@/lib/helpers/guests";
import { ClaimThumb } from "./ClaimThumb";
import { Card } from "./ui/Card";
import {
  ClaimSearch,
  activeFilterCount,
  availableChoices,
  dateRangeField,
  inDateRange,
} from "./ui/ClaimSearch";
import { PaginatedList } from "./ui/PaginatedList";
import { StatusBadge } from "./ui/StatusBadge";
import { PlusIcon } from "./ui/Icons";

type Tab = "checked_in" | "checked_out";

const EMPTY_FILTERS = { unit: "", vehicle: "", range: "" };

export function GuestsList() {
  const [status, setStatus] = useState<Tab>("checked_in");
  const [items, setItems] = useState<GuestItem[]>([]);
  const [canEdit, setCanEdit] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [units, setUnits] = useState<GuestChoice[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [draft, setDraft] = useState(EMPTY_FILTERS);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [reloadKey, setReloadKey] = useState(0);
  const [checkoutId, setCheckoutId] = useState<number | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [counts, setCounts] = useState({ checked_in: 0, checked_out: 0 });

  useEffect(() => {
    const t = window.setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  const loadList = useCallback(() => {
    setLoading(true);
    setError("");
    listGuests({ status, search })
      .then((data) => {
        if (!data.ok) {
          setError(data.message || "Could not load guests.");
          setItems([]);
          return;
        }
        setItems(data.items);
        setCanEdit(data.can_edit);
        setCounts((prev) => ({ ...prev, [status]: data.total }));
      })
      .finally(() => setLoading(false));
  }, [status, search]);

  useEffect(() => {
    loadList();
  }, [loadList, reloadKey]);

  useEffect(() => {
    countGuests(search).then(setCounts);
  }, [search, reloadKey]);

  useEffect(() => {
    loadGuestOptions().then((data) => {
      if (data?.units?.length) setUnits(data.units);
    });
  }, []);

  async function confirmCheckout() {
    if (!checkoutId) return;
    setCheckingOut(true);
    setCheckoutError("");
    try {
      const data = await checkoutGuest(checkoutId);
      if (!data.ok) {
        setCheckoutError(data.message);
        return;
      }
      setCheckoutId(null);
      setReloadKey((k) => k + 1);
    } finally {
      setCheckingOut(false);
    }
  }

  const unitOptions = useMemo(
    () =>
      availableChoices(
        units,
        items.map((item) => ({
          id: item.guest_unit,
          label: item.unit_title,
        }))
      ),
    [units, items]
  );
  const filterFields = useMemo(
    () => [
      ...(unitOptions.length
        ? [
            {
              key: "unit",
              label: "Unit",
              placeholder: "All Units",
              options: unitOptions,
            },
          ]
        : []),
      {
        key: "vehicle",
        label: "Vehicle",
        placeholder: "All",
        options: [
          { id: "yes", label: "Has vehicle" },
          { id: "no", label: "No vehicle" },
        ],
      },
      dateRangeField(),
    ],
    [unitOptions]
  );

  const visible = useMemo(
    () =>
      items.filter((item) => {
        if (filters.unit && String(item.guest_unit) !== filters.unit) return false;
        if (filters.vehicle === "yes" && !item.guest_have_vehicle) return false;
        if (filters.vehicle === "no" && item.guest_have_vehicle) return false;
        return inDateRange(item.guest_check_in, filters.range);
      }),
    [items, filters]
  );
  const filterCount = activeFilterCount(filters);

  return (
    <div className="space-y-4">
      <div className="ceo-claim-tabs">
        {(
          [
            { id: "checked_in", label: "Checked in" },
            { id: "checked_out", label: "Checked out" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`ceo-claim-tab${status === tab.id ? " is-active" : ""}`}
            onClick={() => setStatus(tab.id)}
          >
            {tab.label}
            <span className="ceo-claim-tab__count">
              {loading && status === tab.id ? "…" : counts[tab.id]}
            </span>
          </button>
        ))}
      </div>

      <ClaimSearch
        query={searchInput}
        onQuery={setSearchInput}
        placeholder="Search name, unit, phone, plate…"
        ariaLabel="Search guests"
        fields={filterFields}
        draft={draft}
        onDraft={(next) => setDraft({ ...EMPTY_FILTERS, ...next })}
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
          emptyIcon={search || filterCount ? "search" : "pass"}
          emptyMessage={
            search || filterCount
              ? "No matching guests"
              : status === "checked_in"
                ? "No guests checked in"
                : "No checked-out guests"
          }
          emptySubtitle={
            search || filterCount
              ? "Try another search or filter."
              : status === "checked_in"
                ? "Active guest passes will show up here."
                : "Past guests will show up here."
          }
          getKey={(g) => g.id}
          renderItem={(g) => (
            <div className="ceo-claim-card">
              <ClaimThumb
                src={g.photos?.[0]?.url}
                name={g.guest_names || g.resident_name || g.title}
              />
              <div className="min-w-0 flex-1">
                <p className="ceo-claim-card__title">
                  {g.guest_names || g.title || "Guest"}
                </p>
                <div className="ceo-claim-card__meta">
                  <span>
                    {[g.unit_title, g.resident_name].filter(Boolean).join(" · ") ||
                      "Unit"}
                  </span>
                  <span>
                    {[
                      g.guest_phone,
                      g.guest_number > 1 ? `×${g.guest_number}` : "",
                      g.guest_check_in,
                      g.guest_license_plate,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <StatusBadge
                  label={status === "checked_out" ? "Checked out" : "Checked in"}
                  short
                />
                {canEdit ? (
                  <>
                    {status === "checked_in" && !g.guest_check_out ? (
                      <button
                        type="button"
                        className="text-xs font-semibold text-[var(--accent)]"
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

      {showFilters || !canEdit ? null : (
        <Link href="/account/guests/new" className="ceo-fab">
          <PlusIcon className="h-4 w-4" />
          New guest
        </Link>
      )}

      {checkoutId ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="guest-checkout-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setCheckoutId(null);
          }}
        >
          <div className="w-full max-w-md space-y-4 rounded-2xl bg-[var(--surface)] p-4">
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
              <p className="rounded-xl bg-[#3a1c1c] px-3 py-2 text-sm text-[var(--danger)]">
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
                className="ceo-btn-accent flex-1 rounded-xl bg-[var(--accent)] px-3 py-3 text-sm font-semibold disabled:opacity-60"
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

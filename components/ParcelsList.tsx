"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ParcelChoice, ParcelItem } from "@/lib/parcels";
import {
  listParcels,
  loadParcelOptions,
  signOutParcel,
} from "@/lib/helpers/parcels";
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
import { ListSkeleton } from "./ui/ListState";
import { PaginatedList } from "./ui/PaginatedList";
import { useHeldLoading } from "./ui/useLoadMore";
import { StatusBadge } from "./ui/StatusBadge";
import { MenuSelect } from "./ui/MenuSelect";
import { PlusIcon } from "./ui/Icons";

/** Set true later to show Claimed history tab again. */
const SHOW_CLAIMED_TAB = false;

const EMPTY_FILTERS = { type: "", range: "", assignee: "" };

export function ParcelsList() {
  const [status, setStatus] = useState<"storage" | "claimed">("storage");
  const [items, setItems] = useState<ParcelItem[]>([]);
  const [canEdit, setCanEdit] = useState(false);
  const [pickupTypes, setPickupTypes] = useState<string[]>(["Quick Signout"]);
  const [parcelTypes, setParcelTypes] = useState<ParcelChoice[]>([]);
  const [staff, setStaff] = useState<ParcelChoice[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const pending = useHeldLoading(loading);
  const [signoutId, setSignoutId] = useState<number | null>(null);
  const [pickupType, setPickupType] = useState("Quick Signout");
  const [signingOut, setSigningOut] = useState(false);
  const [signoutError, setSignoutError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [draft, setDraft] = useState(EMPTY_FILTERS);
  const [filters, setFilters] = useState(EMPTY_FILTERS);

  const activeStatus = SHOW_CLAIMED_TAB ? status : "storage";

  useEffect(() => {
    const t = window.setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  const loadList = useCallback(() => {
    setLoading(true);
    setError("");
    listParcels({ status: activeStatus, search })
      .then((data) => {
        if (!data.ok) {
          setError(data.message || "Could not load parcels.");
          setItems([]);
          return;
        }
        setItems(data.items);
        setCanEdit(data.can_edit);
      })
      .finally(() => setLoading(false));
  }, [activeStatus, search]);

  useEffect(() => {
    loadList();
  }, [loadList, reloadKey]);

  useEffect(() => {
    loadParcelOptions().then((data) => {
      if (!data) return;
      setParcelTypes(data.parcel_types || []);
      setStaff(data.staff || []);
      if (data.pickup_types?.length) {
        setPickupTypes(data.pickup_types);
        setPickupType((prev) =>
          data.pickup_types!.includes(prev) ? prev : data.pickup_types![0]
        );
      }
    });
  }, []);

  async function confirmSignout() {
    if (!signoutId) return;
    setSigningOut(true);
    setSignoutError("");
    try {
      const data = await signOutParcel(signoutId, pickupType);
      if (!data.ok) {
        setSignoutError(data.message);
        return;
      }
      setSignoutId(null);
      setReloadKey((k) => k + 1);
    } finally {
      setSigningOut(false);
    }
  }

  const typeOptions = useMemo(
    () =>
      availableChoices(
        parcelTypes,
        items.map((item) => ({
          id: item.parcel_type || item.parcel_type_other || item.parcel_type_label,
          label: item.parcel_type_label || item.parcel_type_other,
        }))
      ),
    [parcelTypes, items]
  );
  const receivedOptions = useMemo(
    () =>
      withUnassigned(
        availableChoices(
          staff,
          items.map((item) => ({
            id: item.parcel_received_by,
            label: item.received_by_name,
          }))
        ),
        items.some((item) => !item.parcel_received_by)
      ),
    [staff, items]
  );
  const filterFields = useMemo(
    () => [
      ...(typeOptions.length
        ? [
            {
              key: "type",
              label: "Type",
              placeholder: "All Types",
              options: typeOptions,
            },
          ]
        : []),
      dateRangeField(),
      ...(receivedOptions.length
        ? [
            {
              key: "assignee",
              label: "Received By",
              placeholder: "All",
              options: receivedOptions,
            },
          ]
        : []),
    ],
    [typeOptions, receivedOptions]
  );

  const visible = useMemo(
    () =>
      items.filter((item) => {
        const typeId = item.parcel_type
          ? String(item.parcel_type)
          : item.parcel_type_other || item.parcel_type_label;
        if (filters.type && typeId !== filters.type) return false;
        if (filters.assignee === "unassigned" && item.parcel_received_by) return false;
        if (
          filters.assignee &&
          filters.assignee !== "unassigned" &&
          String(item.parcel_received_by || "") !== filters.assignee
        ) {
          return false;
        }
        return inDateRange(item.parcel_delivered_on, filters.range);
      }),
    [items, filters]
  );
  const filterCount = activeFilterCount(filters);

  return (
    <div className="space-y-4">
      {SHOW_CLAIMED_TAB ? (
        <div className="ceo-claim-tabs">
          <button
            type="button"
            className={`ceo-claim-tab${status === "storage" ? " is-active" : ""}`}
            onClick={() => setStatus("storage")}
          >
            In storage
          </button>
          <button
            type="button"
            className={`ceo-claim-tab${status === "claimed" ? " is-active" : ""}`}
            onClick={() => setStatus("claimed")}
          >
            Claimed
          </button>
        </div>
      ) : null}

      <ClaimSearch
        query={searchInput}
        onQuery={setSearchInput}
        placeholder="Search unit, resident, barcode…"
        ariaLabel="Search parcels"
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

      {showFilters ? null : pending ? (
        <ListSkeleton rows={3} height={92} />
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
            search || filterCount
              ? "No matching packages"
              : activeStatus === "storage"
                ? "No packages in storage"
                : "No claimed packages"
          }
          emptySubtitle={
            search || filterCount
              ? "Try another search or filter."
              : activeStatus === "storage"
                ? "Deliveries waiting for pickup will show up here."
                : "Claimed packages will show up here."
          }
          getKey={(p) => p.id}
          renderItem={(p) => (
            <div className="ceo-claim-card">
              <ClaimThumb src={p.photos?.[0]?.url} name={p.resident_name} />
              <div className="min-w-0 flex-1">
                <p className="ceo-claim-card__title">
                  {p.resident_name || "Resident"}
                </p>
                <div className="ceo-claim-card__meta">
                  <span>
                    {[
                      p.unit_title,
                      p.parcel_type_label || p.parcel_type_other,
                      p.parcel_delivered_on,
                      p.parcel_number > 1 ? `×${p.parcel_number}` : "",
                      p.comments_parcel_barcode,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <StatusBadge
                  label={
                    p.status === "in_storage" || !p.parcel_pickup_type
                      ? "In storage"
                      : "Claimed"
                  }
                  short
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
          onClick={(e) => {
            if (e.target === e.currentTarget) setSignoutId(null);
          }}
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
              <MenuSelect
                variant="field"
                aria-label="Pickup type"
                value={pickupType}
                options={pickupTypes.map((t) => ({ id: t, label: t }))}
                disabled={signingOut}
                onChange={setPickupType}
              />
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

      {showFilters || !canEdit ? null : (
        <Link href="/account/parcels/new" className="ceo-fab">
          <PlusIcon className="h-4 w-4" />
          New parcel
        </Link>
      )}
    </div>
  );
}

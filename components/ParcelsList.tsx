"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import type { ParcelChoice, ParcelItem } from "@/lib/parcels";
import { useStaffMenuPath } from "@/hooks/useStaffMenuPath";
import { readStoredNavRole } from "@/lib/browser-session";
import { listParcels, loadParcelOptions } from "@/lib/helpers/parcels";
import { ClaimThumb } from "./ClaimThumb";
import { ParcelSignoutForm } from "./ParcelSignoutForm";
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
import { PlusIcon } from "./ui/Icons";

const EMPTY_FILTERS = { type: "", range: "", assignee: "" };

export function ParcelsList() {
  const router = useRouter();
  const [status, setStatus] = useState<"storage" | "claimed">("storage");
  const [items, setItems] = useState<ParcelItem[]>([]);
  const { staff: isStaff } = useStaffMenuPath("/account/parcels");
  const [canEdit, setCanEdit] = useState(false);

  useLayoutEffect(() => {
    if (readStoredNavRole() === "staff") setCanEdit(true);
  }, []);
  const [pickupTypes, setPickupTypes] = useState<string[]>(["Quick Signout"]);
  const [parcelTypes, setParcelTypes] = useState<ParcelChoice[]>([]);
  const [staff, setStaff] = useState<ParcelChoice[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const pending = useHeldLoading(loading);
  const [signoutId, setSignoutId] = useState<number | null>(null);
  const [staffName, setStaffName] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [draft, setDraft] = useState(EMPTY_FILTERS);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [ocrEnabled, setOcrEnabled] = useState(true);

  const activeStatus = status;

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
          setError(data.message || "Could not load packages.");
          setItems([]);
          return;
        }
        setItems(data.items);
        if (data.can_edit || data.is_staff) setCanEdit(true);
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
      if (data.can_edit || data.is_staff) setCanEdit(true);
      setOcrEnabled(Boolean(data.ocr_enabled));
      if (data.current_user_name) setStaffName(data.current_user_name);
      if (data.pickup_types?.length) {
        setPickupTypes(data.pickup_types);
      }
    });
  }, []);

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
    <div className="ceo-parcel-board space-y-4">
      <div className="ceo-claim-tabs" role="tablist" aria-label="Package status">
        <button
          type="button"
          role="tab"
          aria-selected={status === "storage"}
          className={`ceo-claim-tab${status === "storage" ? " is-active" : ""}`}
          onClick={() => setStatus("storage")}
        >
          In Storage
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={status === "claimed"}
          className={`ceo-claim-tab${status === "claimed" ? " is-active" : ""}`}
          onClick={() => setStatus("claimed")}
        >
          Claimed
        </button>
      </div>

      <ClaimSearch
        query={searchInput}
        onQuery={setSearchInput}
        placeholder="Search unit, resident, barcode…"
        ariaLabel="Search packages"
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
        <ListSkeleton rows={3} />
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
                ? "When packages arrive, they will appear here."
                : "When packages are claimed, they will appear here."
          }
          emptyAction={
            search || filterCount || !(canEdit || isStaff) ? undefined : (
              <Link href={ocrEnabled ? "/account/parcels/new?ocr=1" : "/account/parcels/new"}>
                Scan your first package
              </Link>
            )
          }
          getKey={(p) => p.id}
          renderItem={(p) => (
            <Link href={`/account/parcels/${p.id}`} className="ceo-claim-card">
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
                      ? "In Storage"
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
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setSignoutId(p.id);
                        }}
                      >
                        Sign out
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="text-xs font-semibold text-[var(--accent)]"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        router.push(`/account/parcels/${p.id}/edit`);
                      }}
                    >
                      Edit
                    </button>
                  </>
                ) : null}
              </div>
            </Link>
          )}
        />
      )}

      <ParcelSignoutForm
        parcelId={signoutId}
        open={Boolean(signoutId)}
        pickupTypes={pickupTypes}
        staffName={staffName}
        unitTitle={items.find((item) => item.id === signoutId)?.unit_title || ""}
        onClose={() => setSignoutId(null)}
        onDone={() => {
          setSignoutId(null);
          setReloadKey((k) => k + 1);
        }}
      />

      {(canEdit || isStaff) && !pending && items.length > 0 ? (
        <Link
          href={ocrEnabled ? "/account/parcels/new?ocr=1" : "/account/parcels/new"}
          className={`ceo-fab${showFilters ? " is-quiet" : ""}`}
        >
          <PlusIcon className="h-4 w-4" />
          Scan package
        </Link>
      ) : null}
    </div>
  );
}

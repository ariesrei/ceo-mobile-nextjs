"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useStaffMenuPath } from "@/hooks/useStaffMenuPath";
import type { ParcelItem } from "@/lib/parcels";
import { toParcelItem } from "@/lib/helpers/parcels";
import { publicWpErrorMessage } from "@/lib/wp-error";
import { ParcelSignoutForm } from "./ParcelSignoutForm";
import { Card } from "./ui/Card";
import { EmptyState, ListSkeleton } from "./ui/ListState";
import { StatusBadge } from "./ui/StatusBadge";
import { useHeldLoading } from "./ui/useLoadMore";

function Row({ label, value }: { label: string; value?: string | number | null }) {
  const text = value === 0 ? "0" : String(value || "").trim();
  if (!text) return null;
  return (
    <div className="ceo-package-detail__row">
      <span>{label}</span>
      <strong>{text}</strong>
    </div>
  );
}

export function ParcelDetail({ parcelId }: { parcelId: number }) {
  const { staff: isStaff } = useStaffMenuPath("/account/parcels");
  const [item, setItem] = useState<ParcelItem | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const pending = useHeldLoading(loading);
  const [pickupTypes, setPickupTypes] = useState<string[]>(["Quick Signout"]);
  const [staffName, setStaffName] = useState("");
  const [signoutOpen, setSignoutOpen] = useState(false);

  useEffect(() => {
    if (parcelId <= 0) {
      setLoading(false);
      setError("Package not found.");
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(`/api/wp/parcels/${parcelId}`)
      .then(async (res) => {
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(
            publicWpErrorMessage(
              (json as { message?: string }).message || "",
              "Could not load package."
            )
          );
        }
        return toParcelItem(json);
      })
      .then((next) => {
        if (cancelled) return;
        if (!next) {
          setError("Package not found.");
          setItem(null);
          return;
        }
        setItem(next);
        setError("");
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Could not load package.");
          setItem(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [parcelId]);

  useEffect(() => {
    fetch("/api/wp/parcels/options")
      .then((r) => r.json())
      .then((data: { pickup_types?: string[]; current_user_name?: string }) => {
        if (data.pickup_types?.length) setPickupTypes(data.pickup_types);
        if (data.current_user_name) setStaffName(data.current_user_name);
      })
      .catch(() => undefined);
  }, []);

  const inStorage = item
    ? item.status === "in_storage" || !item.parcel_pickup_type
    : false;
  const canEdit = Boolean(item?.can_edit || isStaff);

  if (pending) return <ListSkeleton rows={4} height={72} />;
  if (!item) {
    return (
      <EmptyState icon="inbox" subtitle={error || "It may have been removed."}>
        Package not found
      </EmptyState>
    );
  }

  return (
    <div className="ceo-package-detail space-y-4">
      {item.photos?.length ? (
        <ul className="grid grid-cols-3 gap-2">
          {item.photos.map((photo) => (
            <li
              key={photo.id}
              className="aspect-square overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-2)]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.url} alt="" className="h-full w-full object-cover" />
            </li>
          ))}
        </ul>
      ) : null}

      <Card>
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-lg font-semibold">{item.resident_name || "Resident"}</p>
            <p className="text-sm text-[var(--muted)]">{item.unit_title || "Unit"}</p>
          </div>
          <StatusBadge label={inStorage ? "In Storage" : "Claimed"} />
        </div>
        <div className="ceo-package-detail__rows">
          <Row label="Type" value={item.parcel_type_label || item.parcel_type_other} />
          <Row label="Number of packages" value={item.parcel_number} />
          <Row label="Barcode" value={item.comments_parcel_barcode} />
          <Row label="Delivered on" value={item.parcel_delivered_on} />
          <Row label="Received by" value={item.received_by_name} />
          {inStorage ? null : <Row label="Pickup type" value={item.parcel_pickup_type} />}
          {inStorage ? null : <Row label="Signed out on" value={item.parcel_signedout_on} />}
          {inStorage ? null : <Row label="Signed out by" value={item.signed_out_by} />}
          {inStorage ? null : (
            <Row label="Name" value={item.parcel_signedout_by_name} />
          )}
          {inStorage ? null : (
            <Row label="Unit" value={item.parcel_signedout_by_unit} />
          )}
        </div>
        {!inStorage && item.parcel_signature ? (
          <div className="ceo-package-detail__signature">
            <span>Signature</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.parcel_signature} alt="Signature" />
          </div>
        ) : null}
      </Card>

      {canEdit ? (
        <div className="flex gap-2">
          {inStorage ? (
            <button
              type="button"
              className="flex-1 rounded-xl border border-[var(--border)] px-3 py-3 text-sm font-semibold"
              onClick={() => setSignoutOpen(true)}
            >
              Sign out
            </button>
          ) : null}
          <Link
            href={`/account/parcels/${item.id}/edit`}
            className="ceo-btn-accent flex-1 rounded-xl bg-[var(--accent)] px-3 py-3 text-center text-sm font-semibold text-[#081014]"
          >
            Edit
          </Link>
        </div>
      ) : null}

      <ParcelSignoutForm
        parcelId={item.id}
        open={signoutOpen}
        pickupTypes={pickupTypes}
        staffName={staffName}
        unitTitle={item.unit_title}
        onClose={() => setSignoutOpen(false)}
        onDone={() => {
          setSignoutOpen(false);
          setItem({
            ...item,
            status: "claimed",
          });
          fetch(`/api/wp/parcels/${item.id}`)
            .then((res) => res.json())
            .then((json) => {
              const next = toParcelItem(json);
              if (next) setItem(next);
            })
            .catch(() => undefined);
        }}
      />
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { findReservation } from "@/lib/helpers/reservations";
import type { ReservationItem } from "@/lib/types";
import { EmptyState, ListSkeleton } from "./ui/ListState";

export function ReservationDetail({ id }: { id: number }) {
  const [item, setItem] = useState<ReservationItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    findReservation(id)
      .then((data) => {
        if (data.item) setItem(data.item);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <ListSkeleton rows={3} variant="detail" />;
  if (!item) {
    return (
      <EmptyState subtitle="This booking may no longer be on file.">
        Reservation unavailable
      </EmptyState>
    );
  }

  const rows = [
    ["Amenity", item.resource_name],
    ["Starts", item.start],
    ["Ends", item.end],
    ["Status", item.status],
    ["Guests", item.expected ? String(item.expected) : ""],
    ["Details", item.details && item.details !== "—" ? item.details : ""],
  ].filter(([, value]) => Boolean(value));

  return (
    <dl className="ceo-wo-detail">
      {rows.map(([label, value]) => (
        <div key={label} className="ceo-wo-detail__row">
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

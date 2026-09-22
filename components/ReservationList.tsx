"use client";

import type { ReservationItem } from "@/lib/types";
import { Card } from "./ui/Card";
import { EmptyState } from "./ui/ListState";
import { PaginatedList } from "./ui/PaginatedList";

export function ReservationList({
  items,
  emptyMessage = "No upcoming reservations",
}: {
  items: ReservationItem[];
  emptyMessage?: string;
}) {
  if (items.length === 0) {
    return <EmptyState icon="calendar">{emptyMessage}</EmptyState>;
  }

  return (
    <Card>
      <h2 className="mb-3 font-semibold">Upcoming</h2>
      <PaginatedList
        items={items}
        emptyMessage={emptyMessage}
        getKey={(item) => item.id}
        listClassName="ceo-list"
        renderItem={(item) => (
          <div className="rounded-xl bg-[var(--surface-2)] p-3">
            <p className="font-semibold text-[var(--ink)]">{item.resource_name}</p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {item.start} → {item.end}
            </p>
            <p className="mt-2 inline-flex rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-xs font-medium capitalize text-[var(--accent)]">
              {item.status || "scheduled"}
            </p>
            {item.details && item.details !== "—" ? (
              <p className="mt-2 text-sm text-[var(--muted)]">{item.details}</p>
            ) : null}
          </div>
        )}
      />
    </Card>
  );
}

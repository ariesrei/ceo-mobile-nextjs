"use client";

import type { ReservationItem } from "@/lib/types";
import { Card } from "./ui/Card";
import { EmptyState } from "./ui/ListState";
import { PaginatedList } from "./ui/PaginatedList";

type GuestItem = {
  id: number;
  names: string;
  phone: string;
  check_in: string;
  check_out: string;
};

type Props = {
  guests?: { enabled?: boolean; items: GuestItem[] };
  reservations?: { enabled: boolean; items: ReservationItem[] };
};

export function HistoryLists({ guests, reservations }: Props) {
  return (
    <div className="space-y-4">
      {guests?.enabled ? (
      <Card>
        <h2 className="mb-3 font-semibold">Guests</h2>
        <PaginatedList
          items={guests?.items || []}
          emptyCompact
          emptyIcon="pass"
          emptyMessage="No guest history"
          emptySubtitle="Past guests will show up here."
          getKey={(g) => g.id}
          renderItem={(g) => (
            <div className="rounded-xl bg-[var(--surface-2)] p-3">
              <p className="font-medium">{g.names || "Guest"}</p>
              <p className="text-sm text-[var(--muted)]">
                {[g.check_in, g.check_out].filter(Boolean).join(" → ")}
              </p>
            </div>
          )}
        />
      </Card>
      ) : null}

      {reservations?.enabled ? (
        <Card>
          <h2 className="mb-3 font-semibold">Reservations</h2>
          <PaginatedList
            items={reservations.items}
            emptyCompact
            emptyIcon="calendar"
            emptyMessage="No reservation history"
            emptySubtitle="Past reservations will show up here."
            getKey={(r) => r.id}
            renderItem={(r) => (
              <div className="rounded-xl bg-[var(--surface-2)] p-3">
                <p className="font-medium">{r.resource_name}</p>
                <p className="text-sm text-[var(--muted)]">
                  {r.start} · {r.status}
                </p>
              </div>
            )}
          />
        </Card>
      ) : null}

      {!guests?.enabled && !reservations?.enabled ? (
        <EmptyState icon="inbox" subtitle="Nothing is turned on for this property.">
          No history to show
        </EmptyState>
      ) : null}
    </div>
  );
}

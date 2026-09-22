import type { ReservationItem } from "@/lib/types";

export type SeedAnnouncement = {
  id: number;
  title: string;
  body: string;
  date: string;
  mark: string;
};

export const OPS_SEED_STATS = {
  guests: 4,
  parcels: 3,
  maintenance: 2,
  reservations: 3,
};

export const OPS_SEED_ANNOUNCEMENTS: SeedAnnouncement[] = [
  {
    id: 1,
    title: "Elevator Modernization Notice",
    body: "Work will begin May 24 and continue through June 6.",
    date: "May 15, 2026",
    mark: "EL",
  },
  {
    id: 2,
    title: "Memorial Day Holiday",
    body: "The management office will be closed on May 26.",
    date: "May 13, 2026",
    mark: "MD",
  },
  {
    id: 3,
    title: "Spring Landscaping Update",
    body: "Thank you for your patience as we beautify our community.",
    date: "May 10, 2026",
    mark: "SL",
  },
];

export const OPS_SEED_EVENTS: ReservationItem[] = [
  {
    id: 101,
    resource_name: "Board Meeting",
    start: "2026-09-20T18:00:00",
    end: "2026-09-20T19:30:00",
    status: "scheduled",
    details: "Community Room",
    expected: 24,
  },
  {
    id: 102,
    resource_name: "Pool Maintenance",
    start: "2026-09-22T08:00:00",
    end: "2026-09-22T12:00:00",
    status: "scheduled",
    details: "Pool will be closed",
    expected: 0,
  },
  {
    id: 103,
    resource_name: "Yoga on the Terrace",
    start: "2026-09-28T07:00:00",
    end: "2026-09-28T08:00:00",
    status: "scheduled",
    details: "Rooftop Terrace",
    expected: 12,
  },
];

export function canUseOpsSeed() {
  return process.env.NODE_ENV === "development";
}

export function withSeedStats(live: {
  guests: number;
  parcels: number;
  maintenance: number;
  reservations: number;
}) {
  if (!canUseOpsSeed()) return live;
  const empty =
    !live.guests && !live.parcels && !live.maintenance && !live.reservations;
  return empty ? { ...OPS_SEED_STATS } : live;
}

export function withSeedEvents(items: ReservationItem[], total = 0) {
  if (!canUseOpsSeed()) return { items, total };
  if (items.length) return { items, total: total || items.length };
  return { items: OPS_SEED_EVENTS, total: OPS_SEED_EVENTS.length };
}

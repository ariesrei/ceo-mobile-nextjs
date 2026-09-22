import { apiGet } from "./api";
import { asArray, asPhotoUrl, asRecord, asString } from "./validate";

export type HistoryKind =
  | "maintenance"
  | "reservation"
  | "parcel"
  | "payment"
  | "guest"
  | "warranty"
  | "activity"
  | string;

export type HistoryFeedItem = {
  id: string;
  kind: HistoryKind;
  title: string;
  subtitle: string;
  date: string;
  color: string;
  icon: string;
  parent: string;
};

function toFeedItem(raw: unknown): HistoryFeedItem | null {
  const row = asRecord(raw);
  const id = asString(row?.id);
  if (!row || !id) return null;
  return {
    id,
    kind: asString(row.kind).toLowerCase() || "activity",
    title: asString(row.title),
    subtitle: asString(row.subtitle),
    date: asString(row.date),
    color: asString(row.color),
    icon: asPhotoUrl(row.icon),
    parent: asString(row.parent),
  };
}

export async function listCommunityHistory() {
  const res = await apiGet("/api/wp/history");
  const empty = {
    ok: false as const,
    activity: [] as HistoryFeedItem[],
    transactional: [] as HistoryFeedItem[],
  };
  if (!res.ok) {
    const composed = await composeLiveFeed();
    return composed.length ? { ok: true as const, activity: sortFeed(composed), transactional: [] } : empty;
  }
  const data = asRecord(res.data) || {};
  let activity = asArray(data.activity)
    .map(toFeedItem)
    .filter((item): item is HistoryFeedItem => Boolean(item));
  const transactional = asArray(data.transactional)
    .map(toFeedItem)
    .filter((item): item is HistoryFeedItem => Boolean(item));
  const hasPayments = activity.some((item) => item.kind === "payment");
  if (!hasPayments) {
    const seen = new Set(activity.map((item) => item.id));
    for (const item of transactional) {
      if (!seen.has(item.id)) {
        activity.push(item);
        seen.add(item.id);
      }
    }
  }
  if (!activity.length) {
    activity = await composeLiveFeed();
  }
  return {
    ok: true as const,
    activity: sortFeed(activity),
    transactional,
  };
}

async function composeLiveFeed(): Promise<HistoryFeedItem[]> {
  const [wo, parcels, bookings] = await Promise.all([
    apiGet("/api/wp/maintenance?status=all&per_page=20"),
    apiGet("/api/wp/parcels?status=all&per_page=20"),
    apiGet("/api/wp/reservations?type=all"),
  ]);
  const items: HistoryFeedItem[] = [];
  for (const raw of readRows(wo)) {
    const row = asRecord(raw);
    const id = asString(row?.id);
    if (!id) continue;
    const title = asString(row?.type_label) || asString(row?.title) || "Work Order";
    items.push({
      id: `maintenance-${id}`,
      kind: "maintenance",
      title,
      subtitle: asString(row?.maintenance_description) || `#WO-${id}`,
      date: asString(row?.maintenance_date_request),
      color: "",
      icon: "",
      parent: "",
    });
  }
  for (const raw of readRows(parcels)) {
    const row = asRecord(raw);
    const id = asString(row?.id);
    if (!id) continue;
    const type = asString(row?.parcel_type_label) || asString(row?.parcel_type_other);
    items.push({
      id: `parcel-${id}`,
      kind: "parcel",
      title: "Package Received",
      subtitle: type ? `From ${type}` : "",
      date: asString(row?.parcel_delivered_on),
      color: "",
      icon: "",
      parent: "",
    });
  }
  for (const raw of readRows(bookings)) {
    const row = asRecord(raw);
    const id = asString(row?.id);
    if (!id) continue;
    const name = asString(row?.resource_name);
    items.push({
      id: `reservation-${id}`,
      kind: "reservation",
      title: "Amenity Reservation",
      subtitle: name,
      date: asString(row?.start),
      color: "",
      icon: "",
      parent: "",
    });
  }
  return items;
}

function readRows(res: { ok: boolean; data?: unknown }): unknown[] {
  if (!res.ok) return [];
  const data = asRecord(res.data) || {};
  const nest = asRecord(data.data);
  const items = asArray(data.items);
  return items.length ? items : asArray(nest?.items);
}

function feedTime(date: string): number {
  const parsed = Date.parse(date.includes("T") ? date : date.replace(" ", "T"));
  return Number.isNaN(parsed) ? 0 : parsed;
}

function sortFeed(items: HistoryFeedItem[]): HistoryFeedItem[] {
  return [...items].sort((a, b) => feedTime(b.date) - feedTime(a.date));
}

export function historyWhen(date: string): string {
  const parsed = new Date(date.includes("T") ? date : date.replace(" ", "T"));
  if (!Number.isNaN(parsed.getTime())) {
    const day = parsed.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    const time = parsed.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
    if (/00:00:00/.test(date) || parsed.getHours() + parsed.getMinutes() === 0) {
      return day;
    }
    return `${day} • ${time}`;
  }
  return date;
}

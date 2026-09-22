import { apiGet, queryString } from "./api";
import { asNumber, asPhotoUrl, asRecord, asString, readListPayload } from "./validate";

export type CommunityEvent = {
  id: number;
  title: string;
  start: string;
  end: string;
  venue: string;
  excerpt: string;
  photo: string;
};

export type CommunityAnnouncement = {
  id: number;
  title: string;
  excerpt: string;
  date: string;
  photo: string;
  category: "general" | "updates" | "safety" | string;
};

export function toCommunityEvent(raw: unknown): CommunityEvent | null {
  const row = asRecord(raw);
  const id = asNumber(row?.id);
  if (!row || id <= 0) return null;
  return {
    id,
    title: asString(row.title),
    start: asString(row.start),
    end: asString(row.end),
    venue: asString(row.venue),
    excerpt: asString(row.excerpt),
    photo: asPhotoUrl(row.photo),
  };
}

export function toCommunityAnnouncement(raw: unknown): CommunityAnnouncement | null {
  const row = asRecord(raw);
  const id = asNumber(row?.id);
  if (!row || id <= 0) return null;
  return {
    id,
    title: asString(row.title),
    excerpt: asString(row.excerpt),
    date: asString(row.date),
    photo: asPhotoUrl(row.photo),
    category: asString(row.category).toLowerCase() || "general",
  };
}

export async function listUpcomingEvents(perPage = 5) {
  const res = await apiGet(`/api/wp/events?${queryString({ per_page: perPage })}`);
  if (!res.ok) return { ok: false as const, items: [] as CommunityEvent[], total: 0 };
  const payload = readListPayload(res.data);
  const items = payload.items
    .map(toCommunityEvent)
    .filter((item): item is CommunityEvent => Boolean(item));
  return { ok: true as const, items, total: payload.total || items.length };
}

export async function listAnnouncements(perPage = 5) {
  const res = await apiGet(`/api/wp/announcements?${queryString({ per_page: perPage })}`);
  if (!res.ok) return { ok: false as const, items: [] as CommunityAnnouncement[], total: 0 };
  const payload = readListPayload(res.data);
  const items = payload.items
    .map(toCommunityAnnouncement)
    .filter((item): item is CommunityAnnouncement => Boolean(item));
  return { ok: true as const, items, total: payload.total || items.length };
}

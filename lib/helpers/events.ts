import { apiGet, queryString } from "./api";
import { asNumber, asPhotoUrl, asRecord, asString, readListPayload } from "./validate";

function decodeText(value: string): string {
  const plain = value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  if (!plain.includes("&")) return plain;
  return plain
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) =>
      String.fromCharCode(parseInt(code, 16))
    );
}

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
    title: decodeText(asString(row.title)),
    start: asString(row.start),
    end: asString(row.end),
    venue: decodeText(asString(row.venue)),
    excerpt: decodeText(asString(row.excerpt)),
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

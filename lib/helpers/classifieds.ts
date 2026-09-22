import { apiGet, apiPost, queryString } from "./api";
import { errorFromStatus } from "./errors";
import { asNumber, asPhotoUrl, asRecord, asString, readListPayload } from "./validate";

export type ClassifiedCategory = "for_sale" | "wanted" | "free" | string;

export type ClassifiedItem = {
  id: number;
  title: string;
  excerpt: string;
  description: string;
  date: string;
  photo: string;
  price: string;
  category: ClassifiedCategory;
};

export function toClassifiedItem(raw: unknown): ClassifiedItem | null {
  const row = asRecord(raw);
  const id = asNumber(row?.id);
  if (!row || id <= 0) return null;
  return {
    id,
    title: asString(row.title),
    excerpt: asString(row.excerpt),
    description: asString(row.description) || asString(row.excerpt),
    date: asString(row.date),
    photo: asPhotoUrl(row.photo),
    price: asString(row.price),
    category: asString(row.category).toLowerCase() || "for_sale",
  };
}

export async function listClassifieds(perPage = 40) {
  const res = await apiGet(`/api/wp/classifieds?${queryString({ per_page: perPage })}`);
  if (!res.ok) return { ok: false as const, items: [] as ClassifiedItem[], total: 0 };
  const payload = readListPayload(res.data);
  const items = payload.items
    .map(toClassifiedItem)
    .filter((item): item is ClassifiedItem => Boolean(item));
  return { ok: true as const, items, total: payload.total || items.length };
}

export async function createClassified(input: {
  title: string;
  description: string;
  category: ClassifiedCategory;
  price: string;
}) {
  const res = await apiPost("/api/wp/classifieds", input);
  if (!res.ok) return res;
  const data = asRecord(res.data);
  const item = toClassifiedItem(data?.item);
  if (!item) {
    return {
      ok: false as const,
      error: errorFromStatus(500, "Could not post listing."),
      message: "Could not post listing.",
    };
  }
  return { ok: true as const, item };
}

export function timeAgo(date: string): string {
  const parsed = new Date(date.includes("T") ? date : date.replace(" ", "T"));
  if (Number.isNaN(parsed.getTime())) return date;
  const diff = Math.max(0, Date.now() - parsed.getTime());
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 14) return `${days}d ago`;
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

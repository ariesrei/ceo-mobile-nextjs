import { getConnectConfig } from "@/lib/connect";
import { apiGet } from "./api";
import { asNumber, asPhotoUrl, asRecord, asString, readListPayload } from "./validate";

export type AmenitySpace = "indoor" | "outdoor" | "spaces" | string;

export type AmenityItem = {
  id: number;
  title: string;
  hours: string;
  space: AmenitySpace;
  photo: string;
};

export function toAmenityItem(raw: unknown): AmenityItem | null {
  const row = asRecord(raw);
  const id = asNumber(row?.id);
  if (!row || id <= 0) return null;
  const space = asString(row.space).toLowerCase() || "indoor";
  return {
    id,
    title: asString(row.title),
    hours: asString(row.hours) || "Open daily",
    space,
    photo: amenityPhotoUrl(row),
  };
}

export function amenityPhotoUrl(row: Record<string, unknown>): string {
  const raw =
    asPhotoUrl(row.photo) ||
    asPhotoUrl(row.image) ||
    asPhotoUrl(row.thumbnail) ||
    asPhotoUrl(row.photo_url) ||
    asPhotoUrl(row.featured_image);
  if (!raw) return "";
  if (/[?&]ceo_media_download=/i.test(raw) && !/^https?:\/\//i.test(raw) && !raw.startsWith("//")) {
    const base = (getConnectConfig()?.baseUrl || "").replace(/\/+$/, "");
    const path = raw.startsWith("/") ? raw : `/${raw}`;
    return base ? `${base}${path}` : raw;
  }
  if (raw.startsWith("//")) {
    const scheme =
      typeof window !== "undefined" && window.location.protocol === "https:"
        ? "https"
        : "http";
    return `${scheme}:${raw}`;
  }
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith("/wp-content/") || raw.includes("/wp-content/uploads/")) {
    const base = (getConnectConfig()?.baseUrl || "").replace(/\/+$/, "");
    const path = raw.startsWith("/") ? raw : `/${raw}`;
    return base ? `${base}${path}` : raw;
  }
  return raw;
}

export async function listAmenities() {
  const res = await apiGet("/api/wp/amenities");
  if (!res.ok) {
    return { ok: false as const, items: [] as AmenityItem[], total: 0 };
  }
  const payload = readListPayload(res.data);
  const items = payload.items
    .map(toAmenityItem)
    .filter((item): item is AmenityItem => Boolean(item));
  return {
    ok: true as const,
    items,
    total: payload.total || items.length,
  };
}

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
    photo: asPhotoUrl(row.photo),
  };
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

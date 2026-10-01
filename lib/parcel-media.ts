import type { ParcelPhoto } from "@/lib/parcels";

export async function uploadParcelJpeg(
  image: string,
  parcelId = 0
): Promise<ParcelPhoto> {
  const res = await fetch("/api/wp/parcels/media", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      image,
      parcel_id: parcelId || 0,
    }),
  });
  const data = (await res.json()) as ParcelPhoto & { message?: string };
  if (!res.ok || !data.id) {
    throw new Error(data.message || "Could not attach the photo.");
  }
  return { id: data.id, url: data.url || image };
}

export async function persistParcelPhotos(
  photos: ParcelPhoto[],
  parcelId = 0
): Promise<ParcelPhoto[]> {
  const out: ParcelPhoto[] = [];
  for (const photo of photos) {
    if (photo.id > 0) {
      out.push(photo);
      continue;
    }
    if (!photo.url.startsWith("data:")) {
      continue;
    }
    out.push(await uploadParcelJpeg(photo.url, parcelId));
  }
  return out;
}

export function parseParcelPhotos(raw: unknown): ParcelPhoto[] {
  const list = Array.isArray(raw) ? raw : [];
  const out: ParcelPhoto[] = [];
  for (const item of list) {
    if (typeof item === "number" && item > 0) {
      out.push({ id: item, url: "" });
      continue;
    }
    if (typeof item === "string" && /^\d+$/.test(item.trim())) {
      out.push({ id: Number(item.trim()), url: "" });
      continue;
    }
    if (!item || typeof item !== "object") {
      continue;
    }
    const row = item as { id?: unknown; ID?: unknown; url?: unknown };
    const id = Number(row.id ?? row.ID);
    const url = typeof row.url === "string" ? row.url : "";
    if (id > 0 || url) {
      out.push({ id: id > 0 ? id : 0, url });
    }
  }
  return out;
}

export async function hydrateParcelPhotos(
  photos: ParcelPhoto[]
): Promise<ParcelPhoto[]> {
  const missing = [
    ...new Set(photos.filter((photo) => photo.id > 0 && !photo.url).map((photo) => photo.id)),
  ];
  if (!missing.length) {
    return photos.filter((photo) => photo.url || photo.id > 0);
  }
  const res = await fetch(
    `/api/wp/additional-info/media?ids=${missing.join(",")}`
  );
  if (!res.ok) {
    return photos;
  }
  const json = (await res.json()) as { items?: { id?: number; url?: string }[] };
  const map: Record<number, string> = {};
  for (const item of json.items || []) {
    const id = Number(item?.id);
    const url = String(item?.url || "");
    if (id > 0 && url) {
      map[id] = url;
    }
  }
  return photos
    .map((photo) => (photo.url ? photo : { ...photo, url: map[photo.id] || "" }))
    .filter((photo) => photo.url || photo.id > 0);
}

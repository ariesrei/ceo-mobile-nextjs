import type { ParcelItem, ParcelOptions, ParcelPhoto } from "@/lib/parcels";
import { apiGet, apiPost, queryString } from "./api";
import { AppError, formatAppError, validationError } from "./errors";
import {
  asArray,
  asBoolean,
  asNumber,
  asPhotoUrl,
  asRecord,
  asString,
  readListPayload,
} from "./validate";

export type ParcelStatus = "storage" | "claimed";

export type ParcelListResult =
  | {
      ok: true;
      items: ParcelItem[];
      total: number;
      can_edit: boolean;
      is_staff?: boolean;
    }
  | {
      ok: false;
      items: [];
      total: 0;
      can_edit: false;
      error: AppError;
      message: string;
    };

function toPhoto(raw: unknown): ParcelPhoto | null {
  if (typeof raw === "number" && raw > 0) {
    return { id: raw, url: "" };
  }
  if (typeof raw === "string" && /^\d+$/.test(raw.trim())) {
    return { id: Number(raw.trim()), url: "" };
  }
  const row = asRecord(raw);
  if (!row) return null;
  const id = asNumber(row.id ?? row.ID);
  const url = asPhotoUrl(row.url);
  if (!url && id <= 0) return null;
  return { id, url };
}

async function resolveAttachmentUrls(ids: number[]): Promise<Record<number, string>> {
  const unique = [...new Set(ids.filter((id) => id > 0))];
  if (!unique.length) return {};
  const res = await apiGet(`/api/wp/additional-info/media?ids=${unique.join(",")}`);
  if (!res.ok) return {};
  const map: Record<number, string> = {};
  for (const item of asArray(asRecord(res.data)?.items)) {
    const row = asRecord(item);
    const id = asNumber(row?.id);
    const url = asPhotoUrl(row?.url);
    if (id > 0 && url) map[id] = url;
  }
  return map;
}

function applyPhotoUrls(
  photos: ParcelPhoto[],
  resolved: Record<number, string>
): ParcelPhoto[] {
  return photos
    .map((p) => (p.url ? p : { ...p, url: resolved[p.id] || "" }))
    .filter((p) => Boolean(p.url));
}

export function toParcelItem(raw: unknown): ParcelItem | null {
  const row = asRecord(raw);
  const id = asNumber(row?.id);
  if (!row || id <= 0) return null;
  const photos = asArray(row.photos).map(toPhoto).filter((p): p is ParcelPhoto => Boolean(p));
  return {
    id,
    title: asString(row.title),
    parcel_recipient: asNumber(row.parcel_recipient),
    unit_title: asString(row.unit_title),
    parcel_resident: asNumber(row.parcel_resident),
    resident_name: asString(row.resident_name),
    parcel_type: asNumber(row.parcel_type),
    parcel_type_label: asString(row.parcel_type_label),
    parcel_type_other: asString(row.parcel_type_other),
    parcel_received_by: asNumber(row.parcel_received_by),
    received_by_name: asString(row.received_by_name),
    parcel_number: asNumber(row.parcel_number) || 1,
    comments_parcel_barcode: asString(row.comments_parcel_barcode),
    parcel_delivered_on: asString(row.parcel_delivered_on),
    parcel_signedout_on: asString(row.parcel_signedout_on),
    signed_out_by: asString(row.signed_out_by),
    parcel_signedout_by_name: asString(row.parcel_signedout_by_name),
    parcel_signedout_by_unit: asString(row.parcel_signedout_by_unit),
    parcel_signature: asString(row.parcel_signature),
    photos,
    status: asString(row.status) || "in_storage",
    parcel_pickup_type: asString(row.parcel_pickup_type),
    can_edit: asBoolean(row.can_edit),
  };
}

export async function listParcels(input: {
  status: ParcelStatus;
  search?: string;
  perPage?: number;
}): Promise<ParcelListResult> {
  const qs = queryString({
    status: input.status,
    per_page: input.perPage ?? 50,
    search: input.search,
  });
  const res = await apiGet(`/api/wp/parcels?${qs}`);
  if (!res.ok) {
    return {
      ok: false,
      items: [],
      total: 0,
      can_edit: false,
      error: res.error,
      message: res.message,
    };
  }
  const payload = readListPayload(res.data);
  const items = payload.items
    .map(toParcelItem)
    .filter((item): item is ParcelItem => Boolean(item));
  const resolved = await resolveAttachmentUrls(
    items.flatMap((item) =>
      (item.photos ?? []).filter((p) => !p.url).map((p) => p.id)
    )
  );
  return {
    ok: true,
    items: items.map((item) => ({
      ...item,
      photos: applyPhotoUrls(item.photos ?? [], resolved),
    })),
    total: payload.total || items.length,
    can_edit: payload.can_edit,
    is_staff:
      payload.extra.is_staff === undefined
        ? undefined
        : asBoolean(payload.extra.is_staff),
  };
}

function normalizeBarcode(value: string): string {
  return value.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
}

export async function findDuplicateBarcode(
  barcode: string,
  exceptId = 0
): Promise<ParcelItem | null> {
  const needle = normalizeBarcode(barcode);
  if (needle.length < 4) return null;
  const lists = await Promise.all([
    listParcels({ status: "storage", search: barcode.trim(), perPage: 30 }),
    listParcels({ status: "claimed", search: barcode.trim(), perPage: 30 }),
  ]);
  for (const list of lists) {
    if (!list.ok) continue;
    const match = list.items.find(
      (item) =>
        item.id !== exceptId &&
        normalizeBarcode(item.comments_parcel_barcode) === needle
    );
    if (match) return match;
  }
  return null;
}

export async function countParcelsInStorage() {
  const list = await listParcels({ status: "storage", perPage: 1 });
  return list.ok ? list.total : 0;
}

export async function loadParcelOptions(): Promise<ParcelOptions | null> {
  const res = await apiGet("/api/wp/parcels/options");
  if (!res.ok) return null;
  const data = asRecord(res.data);
  if (!data) return null;
  return data as unknown as ParcelOptions;
}

export type ParcelSignoutInput = {
  parcel_pickup_type: string;
  signed_out_by?: "Resident" | "Others" | "Staff" | string;
  parcel_signedout_on?: string;
  parcel_signedout_by_name?: string;
  parcel_signedout_by_unit?: string;
  parcel_signature?: string;
};

export async function signOutParcel(
  id: number,
  input: string | ParcelSignoutInput
): Promise<{ ok: true } | { ok: false; error: AppError; message: string }> {
  if (id <= 0) {
    const error = validationError("Parcel is required.");
    return { ok: false, error, message: formatAppError(error) };
  }
  const body: ParcelSignoutInput =
    typeof input === "string" ? { parcel_pickup_type: input } : input;
  const type = (body.parcel_pickup_type || "").trim();
  if (!type) {
    const error = validationError("Pickup type is required.");
    return { ok: false, error, message: formatAppError(error) };
  }
  const res = await apiPost(`/api/wp/parcels/${id}/signout`, {
    ...body,
    parcel_pickup_type: type,
  });
  return res.ok ? { ok: true } : { ok: false, error: res.error, message: res.message };
}

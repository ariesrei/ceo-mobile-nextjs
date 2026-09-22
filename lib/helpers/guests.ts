import type { GuestItem, GuestOptions, GuestPhoto } from "@/lib/guests";
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

export type GuestStatus = "checked_in" | "checked_out";

export type GuestListResult =
  | { ok: true; items: GuestItem[]; total: number; can_edit: boolean }
  | { ok: false; items: []; total: 0; can_edit: false; error: AppError; message: string };

function toPhoto(raw: unknown): GuestPhoto | null {
  const row = asRecord(raw);
  const url = asPhotoUrl(row?.url);
  if (!url) return null;
  return { id: asNumber(row?.id), url };
}

export function toGuestItem(raw: unknown): GuestItem | null {
  const row = asRecord(raw);
  const id = asNumber(row?.id);
  if (!row || id <= 0) return null;
  const photos = asArray(row.photos).map(toPhoto).filter((p): p is GuestPhoto => Boolean(p));
  return {
    id,
    title: asString(row.title),
    guest_names: asString(row.guest_names),
    guest_phone: asString(row.guest_phone),
    guest_number: asNumber(row.guest_number) || 1,
    guest_unit: asNumber(row.guest_unit),
    unit_title: asString(row.unit_title),
    guest_current_resident: asNumber(row.guest_current_resident) || undefined,
    resident_name: asString(row.resident_name),
    guest_contact_type: asNumber(row.guest_contact_type) || undefined,
    guest_have_vehicle: asBoolean(row.guest_have_vehicle),
    guest_parking_stall: asString(row.guest_parking_stall) || undefined,
    guest_license_plate: asString(row.guest_license_plate) || undefined,
    guest_car_make: asString(row.guest_car_make) || undefined,
    guest_car_model: asString(row.guest_car_model) || undefined,
    guest_car_color: asString(row.guest_car_color) || undefined,
    guest_car_year: asString(row.guest_car_year) || undefined,
    guest_check_in: asString(row.guest_check_in),
    guest_check_out: asString(row.guest_check_out),
    photos,
    status: asString(row.status) || "checked_in",
    can_edit: asBoolean(row.can_edit),
  };
}

export async function listGuests(input: {
  status: GuestStatus;
  search?: string;
  perPage?: number;
}): Promise<GuestListResult> {
  const qs = queryString({
    status: input.status,
    per_page: input.perPage ?? 50,
    search: input.search,
  });
  const res = await apiGet(`/api/wp/guests?${qs}`);
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
    .map(toGuestItem)
    .filter((item): item is GuestItem => Boolean(item));
  return {
    ok: true,
    items,
    total: payload.total || items.length,
    can_edit: payload.can_edit,
  };
}

export async function loadGuestOptions(): Promise<GuestOptions | null> {
  const res = await apiGet("/api/wp/guests/options");
  if (!res.ok) return null;
  const data = asRecord(res.data);
  if (!data) return null;
  return data as unknown as GuestOptions;
}

export async function countGuests(search?: string) {
  const extra = { search, perPage: 1 as const };
  const [checkedIn, checkedOut] = await Promise.all([
    listGuests({ status: "checked_in", ...extra }),
    listGuests({ status: "checked_out", ...extra }),
  ]);
  return {
    checked_in: checkedIn.ok ? checkedIn.total : 0,
    checked_out: checkedOut.ok ? checkedOut.total : 0,
  };
}

export async function checkoutGuest(
  id: number
): Promise<{ ok: true } | { ok: false; error: AppError; message: string }> {
  if (id <= 0) {
    const error = validationError("Guest is required.");
    return { ok: false, error, message: formatAppError(error) };
  }
  const res = await apiPost(`/api/wp/guests/${id}/checkout`);
  return res.ok ? { ok: true } : { ok: false, error: res.error, message: res.message };
}

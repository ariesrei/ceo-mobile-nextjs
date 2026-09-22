import { apiGet, queryString } from "./api";
import { AppError } from "./errors";
import { asArray, asBoolean, asNumber, asPhotoUrl, asRecord, asString, readListPayload } from "./validate";

export type UnitEntryType = "Guest" | "Delivery";
export type UnitEntryStatus = "active" | "history" | "all";

export type UnitEntryItem = {
  id: number;
  type: UnitEntryType | string;
  type_label: string;
  name: string;
  first_name: string;
  last_name: string;
  unit_title: string;
  entry_date: string;
  expire_date: string;
  phone: string;
  photo: string;
  passcode: string;
  active: boolean;
};

export type UnitEntryListResult =
  | { ok: true; items: UnitEntryItem[]; total: number }
  | { ok: false; items: []; total: 0; error: AppError; message: string };

export function toUnitEntryItem(raw: unknown): UnitEntryItem | null {
  const row = asRecord(raw);
  const id = asNumber(row?.id);
  if (!row || id <= 0) return null;
  const type = asString(row.type) || "Guest";
  const name =
    asString(row.name) ||
    [asString(row.first_name), asString(row.last_name)].filter(Boolean).join(" ") ||
    (type === "Delivery" ? "Delivery" : "Guest");
  return {
    id,
    type,
    type_label: asString(row.type_label) || (type === "Delivery" ? "Delivery" : "Guest"),
    name,
    first_name: asString(row.first_name),
    last_name: asString(row.last_name),
    unit_title: asString(row.unit_title),
    entry_date: asString(row.entry_date),
    expire_date: asString(row.expire_date),
    phone: asString(row.phone),
    photo: asPhotoUrl(row.photo),
    passcode: asString(row.passcode),
    active: asBoolean(row.active),
  };
}

export async function listUnitEntries(input: {
  type?: UnitEntryType | "all";
  status?: UnitEntryStatus;
}): Promise<UnitEntryListResult> {
  const qs = queryString({
    type: input.type || "all",
    status: input.status || "active",
  });
  const res = await apiGet(`/api/wp/unit-entries?${qs}`);
  if (!res.ok) {
    return {
      ok: false,
      items: [],
      total: 0,
      error: res.error,
      message: res.message,
    };
  }
  const payload = readListPayload(res.data);
  const items = asArray(payload.items)
    .map(toUnitEntryItem)
    .filter((item): item is UnitEntryItem => Boolean(item));
  return { ok: true, items, total: payload.total || items.length };
}

import { getConnectConfig } from "@/lib/connect";
import { apiGet } from "./api";
import {
  asArray,
  asBoolean,
  asNumber,
  asPhotoUrl,
  asRecord,
  asString,
  readListPayload,
} from "./validate";

export type AmenitySpace = "indoor" | "outdoor" | "spaces" | string;

export type AmenityExtraInput = "text" | "select" | "checkbox" | "yes_no";

export type AmenityExtraField = {
  label: string;
  input: AmenityExtraInput;
  placeholder: string;
  options: string[];
  required: boolean;
  multiple: boolean;
};

export type AmenityChoice = {
  id: number;
  title: string;
  hours: string;
  additionalFields: AmenityExtraField[];
};

export type AmenityItem = {
  id: number;
  title: string;
  hours: string;
  space: AmenitySpace;
  photo: string;
  amenities: AmenityChoice[];
  additionalFields: AmenityExtraField[];
  rules: string;
};

function toExtraInput(raw: string): AmenityExtraInput {
  const type = raw.toLowerCase().replace(/[\s-]+/g, "_");
  if (type === "select" || type === "checkbox" || type === "yes_no") return type;
  if (type === "yesno") return "yes_no";
  return "text";
}

function extraFieldList(row: Record<string, unknown> | null) {
  if (!row) return [];
  return asArray(row.additional_fields ?? row.additionalFields)
    .map(toAmenityExtraField)
    .filter((field): field is AmenityExtraField => Boolean(field));
}

export function toAmenityExtraField(raw: unknown): AmenityExtraField | null {
  const row = asRecord(raw);
  if (!row) return null;
  const label =
    asString(row.label) ||
    asString(row.additional_field_name) ||
    asString(row.name);
  if (!label) return null;
  const input = toExtraInput(
    asString(row.input) ||
      asString(row.additional_field_type) ||
      asString(row.type)
  );
  const storedValue = asString(row.additional_field_value) || asString(row.value);
  const options = asArray(row.options)
    .map(asString)
    .filter(Boolean);
  const valueOptions = storedValue
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  return {
    label,
    input,
    placeholder:
      asString(row.placeholder) || (input === "text" ? storedValue : ""),
    options:
      options.length
        ? options
        : input === "select" || input === "checkbox"
          ? valueOptions
          : [],
    required:
      asBoolean(row.required) || asBoolean(row.additional_field_required),
    multiple:
      asBoolean(row.multiple) || asBoolean(row.additional_field_multiple),
  };
}

function toAmenityChoice(raw: unknown): AmenityChoice | null {
  const row = asRecord(raw);
  const id = asNumber(row?.id);
  if (!row || id <= 0) return null;
  return {
    id,
    title: asString(row.title),
    hours: asString(row.hours),
    additionalFields: extraFieldList(row),
  };
}

export function toAmenityItem(raw: unknown): AmenityItem | null {
  const row = asRecord(raw);
  const id = asNumber(row?.id);
  if (!row || id <= 0) return null;
  const space = asString(row.space).toLowerCase() || "indoor";
  const additionalFields = extraFieldList(row);
  return {
    id,
    title: asString(row.title),
    hours: asString(row.hours) || "Open daily",
    space,
    photo: amenityPhotoUrl(row),
    amenities: asArray(row.amenities)
      .map(toAmenityChoice)
      .filter((choice): choice is AmenityChoice => Boolean(choice)),
    additionalFields,
    rules: asString(row.rules),
  };
}

export function findReserveAmenity(items: AmenityItem[], amenityId: number) {
  return (
    items.find((row) => row.id === amenityId) ||
    items.find((row) => row.amenities.some((choice) => choice.id === amenityId)) ||
    null
  );
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

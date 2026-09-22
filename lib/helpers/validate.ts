export function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

export function asString(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
}

export function asNumber(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function asBoolean(value: unknown): boolean {
  return value === true || value === 1 || value === "1" || value === "true";
}

export function asPhotoUrl(value: unknown): string {
  if (Array.isArray(value) && value.length) {
    return asPhotoUrl(value[0]);
  }
  if (value && typeof value === "object") {
    const row = value as Record<string, unknown>;
    return asPhotoUrl(row.url ?? row.src ?? row.photo_url ?? row.photo);
  }
  const url = typeof value === "string" ? value.trim() : "";
  if (!url || /^\d+$/.test(url) || /^\/account\/\d+\/?$/.test(url)) return "";
  if (
    /default-user\.jpg|\/pet-profile\.png|pet-d-pic|vehicle-d-pic/i.test(url)
  ) {
    return "";
  }
  if (
    /^https?:\/\//i.test(url) ||
    url.startsWith("//") ||
    url.startsWith("/wp-content/") ||
    url.includes("/wp-content/uploads/")
  ) {
    return url;
  }
  return "";
}

export type ListPayload = {
  items: unknown[];
  total: number;
  can_edit: boolean;
  message: string;
  extra: Record<string, unknown>;
};

export function readListPayload(raw: unknown): ListPayload {
  const data = asRecord(raw) || {};
  const nest = asRecord(data.data);
  const items = asArray(data.items).length ? asArray(data.items) : asArray(nest?.items);
  return {
    items,
    total: asNumber(data.total ?? nest?.total ?? items.length),
    can_edit: asBoolean(data.can_edit ?? nest?.can_edit),
    message: asString(data.message || nest?.message),
    extra: data,
  };
}

export function readActionMessage(raw: unknown, fallback: string): string {
  const data = asRecord(raw);
  return asString(data?.message) || fallback;
}

import { apiGet, apiPost } from "./api";
import { asArray, asBoolean, asNumber, asRecord, asString } from "./validate";

export type StaffNotificationItem = {
  id: number;
  layout: string;
  title: string;
  meta: string;
  href: string;
};

export type StaffNotificationType = {
  id: string;
  label: string;
  group_label: string;
  count: number;
  skip_mark_seen: boolean;
  items: StaffNotificationItem[];
};

export type StaffNotifications = {
  available: boolean;
  total_count: number;
  has_unread: boolean;
  types: StaffNotificationType[];
};

export function notificationTypeMatchesPath(
  type: Pick<StaffNotificationType, "id">,
  path: string
): boolean {
  if (type.id === "maintenance") return path.startsWith("/account/maintenance");
  if (type.id === "unit_entry") return path.startsWith("/account/entry-pass");
  if (type.id.startsWith("warranty") || type.id === "company_coi_expired") {
    return path.startsWith("/account/warranties");
  }
  return false;
}

const EMPTY: StaffNotifications = {
  available: false,
  total_count: 0,
  has_unread: false,
  types: [],
};

const PEEK_KEY = "ceo_staff_notes";

let cache: StaffNotifications | null = null;
let cacheAt = 0;
let inflightItems: Promise<StaffNotifications> | null = null;
let inflightSummary: Promise<StaffNotifications> | null = null;
const FRESH_MS = 20_000;

function readPeek(): StaffNotifications | null {
  if (cache) return cache;
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(PEEK_KEY);
    if (!raw) return null;
    const parsed = asRecord(JSON.parse(raw));
    if (!parsed) return null;
    const available = asBoolean(parsed.available);
    return {
      available,
      total_count: Math.max(0, asNumber(parsed.total_count)),
      has_unread: asBoolean(parsed.has_unread),
      types: [],
    };
  } catch {
    return null;
  }
}

function writePeek(next: StaffNotifications, includeItems: boolean) {
  cacheAt = Date.now();
  if (includeItems || !cache) {
    cache = next;
  } else {
    cache = {
      ...cache,
      available: next.available,
      total_count: next.total_count,
      has_unread: next.has_unread,
      types: cache.types.map((type) => {
        const update = next.types.find((row) => row.id === type.id);
        return update ? { ...type, count: update.count } : type;
      }),
    };
  }
  try {
    sessionStorage.setItem(
      PEEK_KEY,
      JSON.stringify({
        available: cache.available,
        total_count: cache.total_count,
        has_unread: cache.has_unread,
      })
    );
  } catch {
    /* private mode */
  }
}

export function peekStaffNotifications(): StaffNotifications | null {
  return readPeek();
}

export function rememberStaffNotifications(next: StaffNotifications) {
  writePeek(next, next.types.some((type) => type.items.length > 0));
}

function decodeEntities(value: string): string {
  if (!value.includes("&")) return value;
  return value
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

function readItem(raw: unknown): StaffNotificationItem | null {
  const row = asRecord(raw);
  if (!row) return null;
  const title = decodeEntities(asString(row.title));
  if (!title) return null;
  return {
    id: asNumber(row.id),
    layout: asString(row.layout) || "default",
    title,
    meta: decodeEntities(asString(row.meta)),
    href: asString(row.href),
  };
}

function readType(raw: unknown): StaffNotificationType | null {
  const row = asRecord(raw);
  if (!row) return null;
  const id = asString(row.id);
  if (!id) return null;
  return {
    id,
    label: asString(row.label),
    group_label: asString(row.group_label) || asString(row.label),
    count: Math.max(0, asNumber(row.count)),
    skip_mark_seen: asBoolean(row.skip_mark_seen),
    items: asArray(row.items)
      .map(readItem)
      .filter((item): item is StaffNotificationItem => Boolean(item)),
  };
}

function readPayload(raw: unknown): StaffNotifications {
  const data = asRecord(raw);
  if (!data) return EMPTY;
  return {
    available: asBoolean(data.available),
    total_count: Math.max(0, asNumber(data.total_count)),
    has_unread: asBoolean(data.has_unread),
    types: asArray(data.types)
      .map(readType)
      .filter((type): type is StaffNotificationType => Boolean(type)),
  };
}

function cacheIsFresh(includeItems: boolean): boolean {
  if (!cache || Date.now() - cacheAt > FRESH_MS) return false;
  if (!includeItems) return true;
  return cache.types.some((type) => type.items.length > 0) || cache.total_count < 1;
}

export async function loadStaffNotifications(
  includeItems = true
): Promise<StaffNotifications> {
  if (cacheIsFresh(includeItems)) return cache as StaffNotifications;
  if (includeItems && inflightItems) return inflightItems;
  if (!includeItems && inflightSummary) return inflightSummary;

  const request = (async () => {
    const res = await apiGet(
      includeItems ? "/api/wp/notifications" : "/api/wp/notifications?items=0"
    );
    const next = res.ok ? readPayload(res.data) : EMPTY;
    writePeek(next, includeItems);
    return includeItems ? cache || next : next;
  })().finally(() => {
    if (includeItems) inflightItems = null;
    else inflightSummary = null;
  });

  if (includeItems) inflightItems = request;
  else inflightSummary = request;
  return request;
}

export async function ackStaffNotifications(
  type = "all"
): Promise<{ ok: boolean; total_count: number; has_unread: boolean }> {
  const res = await apiPost("/api/wp/notifications/ack", { type });
  if (!res.ok) return { ok: false, total_count: 0, has_unread: false };
  const data = asRecord(res.data);
  return {
    ok: true,
    total_count: Math.max(0, asNumber(data?.total_count)),
    has_unread: asBoolean(data?.has_unread),
  };
}

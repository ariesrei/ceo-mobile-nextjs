import { readStoredNavUser } from "@/lib/browser-session";
import { apiGet, apiPost } from "./api";
import { asArray, asBoolean, asNumber, asRecord, asString } from "./validate";

export type StaffNotificationItem = {
  id: number;
  layout: string;
  title: string;
  meta: string;
  href: string;
  unread: boolean;
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

export function notificationHrefMatchesPath(href: string, path: string): boolean {
  const raw = href.trim();
  if (!raw || !path) return false;
  let pathname = raw.split("?")[0] || "";
  try {
    pathname = new URL(raw, "https://ceo.local").pathname;
  } catch {
    /* keep stripped path */
  }
  if (!pathname || pathname === "/" || pathname === "/account") return false;
  return (
    path === pathname ||
    path.startsWith(`${pathname}/`) ||
    pathname.startsWith(`${path}/`)
  );
}

const EMPTY: StaffNotifications = {
  available: false,
  total_count: 0,
  has_unread: false,
  types: [],
};

const PEEK_KEY = "ceo_staff_notes";
const READ_KEY = "ceo_staff_notes_read";
const INBOX_KEY = "ceo_staff_notes_inbox";
const INBOX_CAP = 16;

type ReadStore = {
  user: string;
  types: Record<string, number[]>;
  cleared: string[];
};

const EMPTY_READ: ReadStore = { user: "", types: {}, cleared: [] };

let cache: StaffNotifications | null = null;
let cacheAt = 0;
let inflightItems: Promise<StaffNotifications> | null = null;
let inflightSummary: Promise<StaffNotifications> | null = null;
const FRESH_MS = 20_000;
const listeners = new Set<(data: StaffNotifications) => void>();

function currentUser(): string {
  return readStoredNavUser();
}

function readReadStore(): ReadStore {
  if (typeof sessionStorage === "undefined") return EMPTY_READ;
  try {
    const raw = sessionStorage.getItem(READ_KEY);
    if (!raw) return EMPTY_READ;
    const parsed = asRecord(JSON.parse(raw));
    if (!parsed) return EMPTY_READ;
    const types: Record<string, number[]> = {};
    const rawTypes = asRecord(parsed.types);
    if (rawTypes) {
      Object.entries(rawTypes).forEach(([id, value]) => {
        types[id] = asArray(value)
          .map((row) => asNumber(row))
          .filter((id) => id > 0);
      });
    }
    return {
      user: asString(parsed.user),
      types,
      cleared: asArray(parsed.cleared)
        .map((row) => asString(row))
        .filter(Boolean),
    };
  } catch {
    return EMPTY_READ;
  }
}

function writeReadStore(store: ReadStore) {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(READ_KEY, JSON.stringify(store));
  } catch {
    /* private mode */
  }
}

function storeApplies(store: ReadStore): boolean {
  const user = currentUser();
  if (store.user && user && store.user !== user) return false;
  return Boolean(store.cleared.length || Object.keys(store.types).length);
}

function stripUnread(item: StaffNotificationItem): StaffNotificationItem {
  return {
    id: item.id,
    layout: item.layout,
    title: item.title,
    meta: item.meta,
    href: item.href,
    unread: true,
  };
}

function mergeTypeItems(
  incoming: StaffNotificationItem[],
  previous: StaffNotificationItem[]
): StaffNotificationItem[] {
  const seen = new Set<number>();
  const merged: StaffNotificationItem[] = [];
  incoming.forEach((item) => {
    if (item.id < 1 || seen.has(item.id)) return;
    seen.add(item.id);
    merged.push(stripUnread(item));
  });
  previous.forEach((item) => {
    if (item.id < 1 || seen.has(item.id)) return;
    seen.add(item.id);
    merged.push(stripUnread(item));
  });
  return merged.slice(0, INBOX_CAP);
}

type InboxStore = {
  user: string;
  types: StaffNotificationType[];
};

function readInbox(): InboxStore {
  if (typeof sessionStorage === "undefined") return { user: "", types: [] };
  try {
    const raw = sessionStorage.getItem(INBOX_KEY);
    if (!raw) return { user: "", types: [] };
    const parsed = asRecord(JSON.parse(raw));
    if (!parsed) return { user: "", types: [] };
    return {
      user: asString(parsed.user),
      types: asArray(parsed.types)
        .map(readType)
        .filter((type): type is StaffNotificationType => Boolean(type)),
    };
  } catch {
    return { user: "", types: [] };
  }
}

function writeInbox(store: InboxStore) {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(INBOX_KEY, JSON.stringify(store));
  } catch {
    /* private mode */
  }
}

function mergeInbox(data: StaffNotifications): StaffNotifications {
  if (!data.available) return data;
  const user = currentUser();
  const prev = readInbox();
  const inbox =
    prev.user && user && prev.user !== user ? { user, types: [] } : prev;
  const previous = new Map(inbox.types.map((type) => [type.id, type]));
  const types = data.types.map((type) => {
    const prior = previous.get(type.id);
    return {
      ...type,
      items: mergeTypeItems(type.items, prior?.items || []),
    };
  });
  writeInbox({ user: user || inbox.user, types });
  return { ...data, types };
}

export function applyNotificationReads(
  data: StaffNotifications
): StaffNotifications {
  if (!data.available) return data;
  const store = readReadStore();
  const apply = storeApplies(store);
  const types = data.types.map((type) => {
    const readIds = apply ? new Set(store.types[type.id] || []) : new Set<number>();
    const cleared = apply && store.cleared.includes(type.id);
    if (type.items.length) {
      const items = type.items.map((item) => ({
        ...item,
        unread: item.id > 0 ? !readIds.has(item.id) : !cleared,
      }));
      return {
        ...type,
        items,
        count: items.filter((item) => item.unread).length,
      };
    }
    if (cleared) return { ...type, count: 0 };
    return type;
  });
  const total_count = types.reduce(
    (sum, type) => sum + Math.max(0, type.count),
    0
  );
  return { ...data, types, total_count, has_unread: total_count > 0 };
}

export function rememberNotificationsRead(
  data: StaffNotifications,
  typeId: string,
  itemIds?: number[]
) {
  const user = currentUser();
  const prev = readReadStore();
  const store: ReadStore =
    prev.user && user && prev.user !== user
      ? { user, types: {}, cleared: [] }
      : {
          user: user || prev.user,
          types: { ...prev.types },
          cleared: [...prev.cleared],
        };

  const types =
    typeId === "all"
      ? data.types
      : data.types.filter((type) => type.id === typeId);

  types.forEach((type) => {
    const extra =
      itemIds && typeId === type.id
        ? itemIds
        : type.items.map((item) => item.id).filter((id) => id > 0);
    store.types[type.id] = [
      ...new Set([...(store.types[type.id] || []), ...extra]),
    ];
    if (!itemIds || typeId === "all") {
      if (!store.cleared.includes(type.id)) store.cleared.push(type.id);
    }
  });

  writeReadStore(store);
}

function emitStaffNotifications(data: StaffNotifications) {
  listeners.forEach((fn) => fn(data));
}

export function subscribeStaffNotifications(
  fn: (data: StaffNotifications) => void
) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

function readPeek(): StaffNotifications | null {
  if (cache) return applyNotificationReads(cache);
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(PEEK_KEY);
    if (!raw) return null;
    const parsed = asRecord(JSON.parse(raw));
    if (!parsed) return null;
    const available = asBoolean(parsed.available);
    return applyNotificationReads({
      available,
      total_count: Math.max(0, asNumber(parsed.total_count)),
      has_unread: asBoolean(parsed.has_unread),
      types: [],
    });
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

export function invalidateStaffNotifications() {
  cacheAt = 0;
  inflightItems = null;
  inflightSummary = null;
}

export function clearStaffNotifications() {
  cache = null;
  cacheAt = 0;
  inflightItems = null;
  inflightSummary = null;
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.removeItem(PEEK_KEY);
    sessionStorage.removeItem(READ_KEY);
    sessionStorage.removeItem(INBOX_KEY);
  } catch {
    /* private mode */
  }
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
    unread: row.unread === undefined ? true : asBoolean(row.unread),
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
  if (cacheIsFresh(includeItems)) {
    return applyNotificationReads(cache as StaffNotifications);
  }
  if (includeItems && inflightItems) return inflightItems;
  if (!includeItems && inflightSummary) return inflightSummary;

  const request = (async () => {
    const res = await apiGet(
      includeItems ? "/api/wp/notifications" : "/api/wp/notifications?items=0"
    );
    const raw = res.ok ? readPayload(res.data) : EMPTY;
    const next = applyNotificationReads(includeItems ? mergeInbox(raw) : raw);
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
  invalidateStaffNotifications();
  if (!res.ok) return { ok: false, total_count: 0, has_unread: false };
  const data = asRecord(res.data);
  return {
    ok: true,
    total_count: Math.max(0, asNumber(data?.total_count)),
    has_unread: asBoolean(data?.has_unread),
  };
}

export function publishStaffNotifications(next: StaffNotifications) {
  const overlaid = applyNotificationReads(next);
  rememberStaffNotifications(overlaid);
  emitStaffNotifications(overlaid);
  return overlaid;
}

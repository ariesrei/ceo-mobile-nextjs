import type { MenuItem } from "@/lib/types";

const STORAGE_KEY = "ceo_ops_shortcuts_v1";

export const QUICK_ACTION_ITEMS: MenuItem[] = [
  {
    id: "maintenance",
    label: "Make a Request",
    path: "/account/maintenance",
    enabled: true,
    group: "staff",
  },
  {
    id: "reservations",
    label: "Reserve Amenity",
    path: "/account/reservations",
    enabled: true,
    group: "staff",
  },
  {
    id: "additional_info",
    label: "View Documents",
    path: "/account/documents",
    enabled: true,
    group: "staff",
  },
  {
    id: "edit_profile",
    label: "Update My Info",
    path: "/account/edit",
    enabled: true,
    group: "staff",
  },
  {
    id: "pay_balance",
    label: "Pay Balance",
    path: "/account/pay",
    enabled: true,
    group: "staff",
  },
  {
    id: "contacts",
    label: "Contact Management",
    path: "/account/contacts",
    enabled: true,
    group: "staff",
  },
];


export const SHORTCUT_PATHS: Record<string, string> = {
  "/account/guests": "guests",
  "/account/parcels": "parcels",
  "/account/maintenance": "maintenance",
  "/account/activities": "activities",
  "/account/reservations": "reservations",
  "/account/messaging": "messaging",
  "/account/pay": "pay_balance",
  "/account/events": "events",
  "/account/announcements": "announcements",
  "/account/documents": "additional_info",
  "/account/preferences": "preferences",
  "/account/classifieds": "classifieds",
  "/account/history": "history",
};

const DEFAULT_ORDER = [
  "guests",
  "parcels",
  "maintenance",
  "reservations",
  "activities",
];

type ShortcutCounts = Record<string, { count: number; lastAt: number }>;

function readCounts(): ShortcutCounts {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as ShortcutCounts) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeCounts(next: ShortcutCounts) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* private mode */
  }
}

export function trackShortcut(id: string) {
  if (!id) return;
  const counts = readCounts();
  const prev = counts[id] || { count: 0, lastAt: 0 };
  counts[id] = { count: prev.count + 1, lastAt: Date.now() };
  writeCounts(counts);
}

export function trackShortcutPath(pathname: string) {
  const id = SHORTCUT_PATHS[pathname];
  if (id) trackShortcut(id);
}

export function sortByUsage<T extends { id: string }>(items: T[], limit = 4): T[] {
  const counts = readCounts();
  const used = items.some((item) => (counts[item.id]?.count || 0) > 0);
  const ranked = [...items].sort((a, b) => {
    const aCount = counts[a.id]?.count || 0;
    const bCount = counts[b.id]?.count || 0;
    if (used && aCount !== bCount) return bCount - aCount;
    if (!used) {
      return DEFAULT_ORDER.indexOf(a.id) - DEFAULT_ORDER.indexOf(b.id);
    }
    const aSeen = counts[a.id]?.lastAt || 0;
    const bSeen = counts[b.id]?.lastAt || 0;
    return bSeen - aSeen;
  });
  return ranked.slice(0, limit);
}

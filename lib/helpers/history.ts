import { apiGet } from "./api";
import { asArray, asNumber, asRecord, asString, readListPayload } from "./validate";

export type HistoryTabId =
  | "reservations"
  | "parcels"
  | "guests"
  | "activity"
  | "warranty"
  | "maintenance";

export type HistoryTabItem = {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  status: string;
};

export type HistoryTab = {
  id: HistoryTabId;
  label: string;
  enabled: boolean;
  items: HistoryTabItem[];
};

const ORDER: HistoryTabId[] = [
  "reservations",
  "parcels",
  "guests",
  "activity",
  "warranty",
  "maintenance",
];

const LABELS: Record<HistoryTabId, string> = {
  reservations: "Reservation History",
  parcels: "Parcel History",
  guests: "Guest History",
  activity: "Activity History",
  warranty: "Warranty History",
  maintenance: "Maintenance History",
};

function toTabItem(raw: unknown, index: number): HistoryTabItem | null {
  const row = asRecord(raw);
  if (!row) return null;
  const title =
    asString(row.title) ||
    asString(row.names) ||
    asString(row.resource_name) ||
    asString(row.name);
  const id = asString(row.id) || (asNumber(row.id) > 0 ? String(asNumber(row.id)) : `${title}-${index}`);
  if (!title && !id) return null;
  const checkIn = asString(row.check_in) || asString(row.checkin);
  const checkOut = asString(row.check_out) || asString(row.checkout);
  const start = asString(row.start);
  const end = asString(row.end);
  return {
    id,
    title: title || "Record",
    subtitle:
      asString(row.subtitle) ||
      (checkIn || checkOut ? [checkIn, checkOut].filter(Boolean).join(" → ") : "") ||
      (start || end ? [start, end].filter(Boolean).join(" – ") : "") ||
      asString(row.type),
    date: asString(row.date) || checkIn || start || asString(row.delivered),
    status: asString(row.status),
  };
}

function emptyTabs(): HistoryTab[] {
  return ORDER.map((id) => ({
    id,
    label: LABELS[id],
    enabled: false,
    items: [],
  }));
}

function parseTabs(raw: unknown): HistoryTab[] {
  const tabs = asRecord(raw) || {};
  return ORDER.map((id) => {
    const row = asRecord(tabs[id]);
    const items = asArray(row?.items)
      .map(toTabItem)
      .filter((item): item is HistoryTabItem => Boolean(item));
    return {
      id,
      label: asString(row?.label) || LABELS[id],
      enabled: Boolean(row?.enabled),
      items,
    };
  });
}

export async function listHistoryTabs() {
  const res = await apiGet("/api/wp/history");
  if (res.ok) {
    const data = asRecord(res.data) || {};
    const tabs = parseTabs(data.tabs);
    if (tabs.some((tab) => tab.enabled)) {
      return { ok: true as const, tabs };
    }
  }
  return { ok: true as const, tabs: await composeHistoryTabs() };
}

async function composeHistoryTabs(): Promise<HistoryTab[]> {
  const tabs = emptyTabs();
  const [bookings, parcels, maintenance, warranties] = await Promise.all([
    apiGet("/api/wp/reservations?type=previous"),
    apiGet("/api/wp/parcels?status=claimed&per_page=50"),
    apiGet("/api/wp/maintenance?status=all&scope=mine&per_page=50"),
    apiGet("/api/wp/warranties?status=all&per_page=50"),
  ]);

  const bookingRows = readListPayload(bookings.ok ? bookings.data : {}).items;
  if (bookings.ok) {
    tabs[0].enabled = true;
    tabs[0].items = bookingRows
      .map(toTabItem)
      .filter((item): item is HistoryTabItem => Boolean(item));
  }

  const parcelRows = readListPayload(parcels.ok ? parcels.data : {}).items;
  if (parcels.ok) {
    tabs[1].enabled = true;
    tabs[1].items = parcelRows.map((raw, index) => {
      const row = asRecord(raw);
      return {
        id: String(asNumber(row?.id) || index),
        title: asString(row?.title) || "Parcel",
        subtitle: asString(row?.parcel_type_label) || asString(row?.parcel_type_other),
        date: asString(row?.parcel_delivered_on),
        status: asString(row?.status_label) || asString(row?.parcel_status),
      };
    });
  }

  if (maintenance.ok) {
    tabs[5].enabled = true;
    tabs[5].items = readListPayload(maintenance.data)
      .items.map((raw, index) => {
        const row = asRecord(raw);
        return {
          id: String(asNumber(row?.id) || index),
          title: asString(row?.title) || asString(row?.type_label) || "Work Order",
          subtitle: asString(row?.type_label),
          date: asString(row?.maintenance_date_request),
          status: asString(row?.status_label),
        };
      });
  }

  if (warranties.ok) {
    tabs[4].enabled = true;
    tabs[4].items = readListPayload(warranties.data)
      .items.map((raw, index) => {
        const row = asRecord(raw);
        return {
          id: String(asNumber(row?.id) || index),
          title: asString(row?.title) || asString(row?.request) || "Warranty",
          subtitle: asString(row?.unit_title),
          date: "",
          status: asString(row?.status_label),
        };
      });
  }

  return tabs;
}

export function historyWhen(date: string): string {
  if (!date) return "";
  const parsed = new Date(date.includes("T") ? date : date.replace(" ", "T"));
  if (!Number.isNaN(parsed.getTime())) {
    const day = parsed.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    const time = parsed.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
    if (/00:00:00/.test(date) || parsed.getHours() + parsed.getMinutes() === 0) {
      return day;
    }
    return `${day} • ${time}`;
  }
  return date;
}

import type { ReservationItem } from "@/lib/types";
import { apiGet, apiPost, queryString } from "./api";
import { errorFromStatus } from "./errors";
import { asArray, asBoolean, asNumber, asRecord, asString, readActionMessage, readListPayload } from "./validate";

export type ReservationSlot = {
  value: string;
  label: string;
  full: boolean;
};

export type ReservationSlots = {
  times: ReservationSlot[];
  maxPeople: number;
  maxHours: number;
  changeover: boolean;
  checkIn: string;
  checkOut: string;
  limitReached: boolean;
  message: string;
  waitlist: boolean;
  minAdvance: number;
  displayDays: number;
  primaryVisitor: string;
};

function toSlot(raw: unknown): ReservationSlot | null {
  const row = asRecord(raw);
  if (row) {
    const value = asString(row.value);
    if (!value) return null;
    return {
      value,
      label: asString(row.label) || value,
      full: asBoolean(row.full),
    };
  }
  const value = asString(raw);
  return value ? { value, label: value, full: false } : null;
}

function emptySlots(message = ""): ReservationSlots {
  return {
    times: [],
    maxPeople: 1,
    maxHours: 0,
    changeover: false,
    checkIn: "",
    checkOut: "",
    limitReached: false,
    message,
    waitlist: false,
    minAdvance: 0,
    displayDays: 0,
    primaryVisitor: "off",
  };
}

export async function getReservationSlots(input: {
  amenity: number;
  date: string;
  people?: number;
  mode?: "start" | "end";
  startTime?: string;
}): Promise<ReservationSlots> {
  const qs = queryString({
    amenity: input.amenity,
    date: input.date,
    people: input.people || 1,
    mode: input.mode || "start",
    start_time: input.startTime,
  });
  const res = await apiGet(`/api/wp/reservations/slots?${qs}`);
  if (!res.ok) {
    return emptySlots(res.message);
  }
  const data = asRecord(res.data) || {};
  const times = asArray(data.times)
    .map(toSlot)
    .filter((item): item is ReservationSlot => Boolean(item));
  return {
    times,
    maxPeople: Math.max(1, asNumber(data.max_people) || 1),
    maxHours: asNumber(data.max_hours),
    changeover: asBoolean(data.changeover),
    checkIn: asString(data.check_in),
    checkOut: asString(data.check_out),
    limitReached: asBoolean(data.limit_reached),
    message: asString(data.message),
    waitlist: asBoolean(data.waitlist),
    minAdvance: asNumber(data.min_advance),
    displayDays: asNumber(data.display_days),
    primaryVisitor: asString(data.primary_visitor) || "off",
  };
}

export async function createReservation(input: {
  amenity: number;
  date: string;
  startTime: string;
  endTime: string;
  endDate?: string;
  people: number;
  comments?: string;
  waitlistAcknowledged?: boolean;
}) {
  const res = await apiPost("/api/wp/reservations", {
    amenity: input.amenity,
    date: input.date,
    start_time: input.startTime,
    end_time: input.endTime,
    end_date: input.endDate || input.date,
    people: input.people,
    comments: input.comments || "",
    waitlist_acknowledged: input.waitlistAcknowledged ? 1 : 0,
  });
  if (!res.ok) return res;
  const data = asRecord(res.data);
  const item = toReservationItem(data?.item);
  if (!item) {
    return {
      ok: false as const,
      error: errorFromStatus(500, "Could not save reservation."),
      message: "Could not save reservation.",
    };
  }
  return {
    ok: true as const,
    item,
    message: readActionMessage(data, "Reserved."),
    status: asString(data?.status) || item.status,
  };
}

export function toReservationItem(raw: unknown): ReservationItem | null {
  const row = asRecord(raw);
  const id = asNumber(row?.id);
  if (!row || id <= 0) return null;
  return {
    id,
    resource_name: asString(row.resource_name || row.title),
    start: asString(row.start || row.start_date),
    end: asString(row.end || row.end_date),
    status: asString(row.status) || "scheduled",
    details: asString(row.details),
    expected: asNumber(row.expected),
  };
}

export async function listUpcomingReservations(perPage = 5) {
  const qs = queryString({ type: "upcoming", per_page: perPage });
  const res = await apiGet(`/api/wp/reservations?${qs}`);
  if (!res.ok) {
    return { ok: false as const, items: [] as ReservationItem[], total: 0 };
  }
  const payload = readListPayload(res.data);
  const items = payload.items
    .map(toReservationItem)
    .filter((item): item is ReservationItem => Boolean(item));
  return {
    ok: true as const,
    items,
    total: payload.total || items.length,
  };
}

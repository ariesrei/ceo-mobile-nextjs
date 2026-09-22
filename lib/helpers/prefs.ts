import { apiGet, apiPost } from "./api";
import { asBoolean, asRecord, asString } from "./validate";

export type CommunityCadence = "weekly" | "daily" | "off";
export type EventsCadence = "24h" | "1h" | "morning" | "off";
export type ParcelsCadence = "instant" | "daily" | "off";

export type AppPrefs = {
  push: boolean;
  email: boolean;
  sms: boolean;
  community: CommunityCadence;
  events: EventsCadence;
  parcels: ParcelsCadence;
};

export const COMMUNITY_OPTIONS: { id: CommunityCadence; label: string }[] = [
  { id: "weekly", label: "Weekly Digest" },
  { id: "daily", label: "Daily" },
  { id: "off", label: "Off" },
];

export const EVENTS_OPTIONS: { id: EventsCadence; label: string }[] = [
  { id: "24h", label: "24 Hours before" },
  { id: "1h", label: "1 Hour before" },
  { id: "morning", label: "Morning of" },
  { id: "off", label: "Off" },
];

export const PARCELS_OPTIONS: { id: ParcelsCadence; label: string }[] = [
  { id: "instant", label: "Instant" },
  { id: "daily", label: "Daily digest" },
  { id: "off", label: "Off" },
];

function pickChoice<T extends string>(value: string, allowed: readonly T[], fallback: T): T {
  return (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

export function cadenceLabel(
  key: "community" | "events" | "parcels",
  value: string
): string {
  const options =
    key === "community"
      ? COMMUNITY_OPTIONS
      : key === "events"
        ? EVENTS_OPTIONS
        : PARCELS_OPTIONS;
  return options.find((item) => item.id === value)?.label || value;
}

export function toPrefs(raw: unknown): AppPrefs | null {
  const row = asRecord(raw);
  if (!row) return null;
  const pushRaw = row.push;
  return {
    push:
      pushRaw === undefined || pushRaw === null || pushRaw === ""
        ? true
        : asBoolean(pushRaw),
    email: asBoolean(row.email),
    sms: asBoolean(row.sms),
    community: pickChoice(asString(row.community), ["weekly", "daily", "off"], "weekly"),
    events: pickChoice(asString(row.events), ["24h", "1h", "morning", "off"], "24h"),
    parcels: pickChoice(asString(row.parcels), ["instant", "daily", "off"], "instant"),
  };
}

export async function getPrefs() {
  const res = await apiGet("/api/wp/prefs");
  if (!res.ok) return { ok: false as const, item: null };
  const item = toPrefs(res.data);
  return item ? { ok: true as const, item } : { ok: false as const, item: null };
}

export async function savePrefs(patch: Partial<AppPrefs>) {
  const res = await apiPost("/api/wp/prefs", patch);
  if (!res.ok) return { ok: false as const, item: null };
  const item = toPrefs(res.data);
  return item ? { ok: true as const, item } : { ok: false as const, item: null };
}

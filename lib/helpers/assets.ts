import type { PetItem, VehicleItem } from "@/lib/additional-info";
import { apiGet } from "./api";
import { asArray, asBoolean, asNumber, asPhotoUrl, asRecord, asString } from "./validate";

export type AssetPet = PetItem & { photo: string };
export type AssetVehicle = VehicleItem & { photo: string };

export type AssetsPayload = {
  pets: AssetPet[];
  vehicles: AssetVehicle[];
};

function toPet(raw: unknown): AssetPet | null {
  const row = asRecord(raw);
  const id = asNumber(row?.id);
  if (!row || id <= 0) return null;
  return {
    id,
    type_id: asNumber(row.type_id),
    type: asString(row.type),
    pet_name: asString(row.pet_name),
    pet_breed: asString(row.pet_breed),
    pet_dob: asString(row.pet_dob),
    pet_microchip_number: asString(row.pet_microchip_number),
    pet_weight: asString(row.pet_weight),
    service_animal: asBoolean(row.service_animal),
    desc: asString(row.desc),
    photo: pickAssetPhoto(row),
    status: asString(row.status),
    pending: asBoolean(row.pending),
  };
}

function toVehicle(raw: unknown): AssetVehicle | null {
  const row = asRecord(raw);
  const id = asNumber(row?.id);
  if (!row || id <= 0) return null;
  return {
    id,
    year: asString(row.year),
    make: asString(row.make),
    model: asString(row.model),
    color: asString(row.color),
    license_plate: asString(row.license_plate),
    state: asString(row.state),
    scantag: asString(row.scantag),
    expiry: asString(row.expiry),
    electric_vehicle: asBoolean(row.electric_vehicle),
    active: asBoolean(row.active),
    photo: pickAssetPhoto(row),
    status: asString(row.status),
    pending: asBoolean(row.pending),
  };
}

function pickAssetPhoto(row: Record<string, unknown>): string {
  return (
    asPhotoUrl(row.photo) ||
    asPhotoUrl(row.photo_url) ||
    asPhotoUrl(row.pet_picture) ||
    asPhotoUrl(row.vehicle_picture) ||
    asPhotoUrl(row.picture) ||
    asPhotoUrl(row.image)
  );
}

function photoAttachmentId(row: Record<string, unknown>): number {
  const direct = asNumber(row.photo_id);
  if (direct > 0) return direct;
  for (const key of [
    "photo",
    "photo_url",
    "pet_picture",
    "vehicle_picture",
    "picture",
    "image",
  ]) {
    const value = row[key];
    if (typeof value === "number" && value > 0) return value;
    if (typeof value === "string" && /^\d+$/.test(value.trim())) {
      return Number(value.trim());
    }
    const rec = asRecord(value);
    if (rec) {
      const nested = asNumber(rec.ID ?? rec.id);
      if (nested > 0) return nested;
    }
  }
  return 0;
}

async function resolveAttachmentUrls(ids: number[]): Promise<Record<number, string>> {
  const unique = [...new Set(ids.filter((id) => id > 0))];
  if (!unique.length) return {};
  const res = await apiGet(`/api/wp/additional-info/media?ids=${unique.join(",")}`);
  if (!res.ok) return {};
  const items = asArray(asRecord(res.data)?.items);
  const map: Record<number, string> = {};
  for (const item of items) {
    const row = asRecord(item);
    const id = asNumber(row?.id);
    const url = asPhotoUrl(row?.url);
    if (id > 0 && url) map[id] = url;
  }
  return map;
}

function withResolvedPhoto<T extends { photo: string }>(
  item: T,
  raw: unknown,
  resolved: Record<number, string>
): T {
  if (item.photo) return item;
  const id = photoAttachmentId(asRecord(raw) || {});
  if (id > 0 && resolved[id]) {
    return { ...item, photo: resolved[id] };
  }
  return item;
}

export async function loadAssets(): Promise<AssetsPayload> {
  const res = await apiGet("/api/wp/additional-info");
  if (!res.ok) return { pets: [], vehicles: [] };
  const root = asRecord(res.data) || {};
  const sections = asRecord(root.sections) || asRecord(asRecord(root.data)?.sections) || {};
  const rawPets = asArray(asRecord(sections.pets)?.items);
  const rawVehicles = asArray(asRecord(sections.vehicles)?.items);
  const needIds = [...rawPets, ...rawVehicles].flatMap((raw) => {
    const row = asRecord(raw);
    if (!row || pickAssetPhoto(row)) return [];
    const id = photoAttachmentId(row);
    return id > 0 ? [id] : [];
  });
  const resolved = await resolveAttachmentUrls(needIds);
  const pets = rawPets
    .map((raw) => {
      const pet = toPet(raw);
      return pet ? withResolvedPhoto(pet, raw, resolved) : null;
    })
    .filter((item): item is AssetPet => Boolean(item));
  const vehicles = rawVehicles
    .map((raw) => {
      const vehicle = toVehicle(raw);
      return vehicle ? withResolvedPhoto(vehicle, raw, resolved) : null;
    })
    .filter((item): item is AssetVehicle => Boolean(item));
  return { pets, vehicles };
}

export function petAgeLabel(dob: string): string {
  const parsed = parseAssetDate(dob);
  if (!parsed) return "";
  const now = new Date();
  let months =
    (now.getFullYear() - parsed.getFullYear()) * 12 +
    (now.getMonth() - parsed.getMonth());
  if (now.getDate() < parsed.getDate()) months -= 1;
  if (months < 0) return "";
  if (months < 12) {
    const n = Math.max(months, 0);
    return n === 1 ? "1 month old" : `${n} months old`;
  }
  const years = Math.floor(months / 12);
  return years === 1 ? "1 year old" : `${years} years old`;
}

function parseAssetDate(value: string): Date | null {
  const raw = value.trim();
  if (!raw) return null;
  const iso = raw.includes("T") ? raw : raw.replace(" ", "T");
  const direct = new Date(iso);
  if (!Number.isNaN(direct.getTime())) return direct;
  const us = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (us) {
    const next = new Date(Number(us[3]), Number(us[1]) - 1, Number(us[2]));
    return Number.isNaN(next.getTime()) ? null : next;
  }
  return null;
}

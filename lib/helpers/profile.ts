import { apiGet } from "./api";
import { asPhotoUrl, asRecord, asString } from "./validate";
import type { Profile } from "@/lib/types";

export function toProfile(raw: unknown): Profile | null {
  const row = asRecord(raw);
  if (!row) return null;
  return {
    id: Number(row.id) || 0,
    first_name: asString(row.first_name),
    last_name: asString(row.last_name),
    full_name: asString(row.full_name),
    email: asString(row.email),
    ceo_email: asString(row.ceo_email),
    salutation: asString(row.salutation),
    contact_type: asString(row.contact_type),
    company: asString(row.company),
    job_title: asString(row.job_title),
    website: asString(row.website),
    phone: asString(row.phone),
    mobile: asString(row.mobile),
    company_phone: asString(row.company_phone),
    coi_expiration: asString(row.coi_expiration),
    payment_terms: asString(row.payment_terms),
    allergies: asString(row.allergies),
    emergency_contact: asString(row.emergency_contact),
    opt_email: Boolean(row.opt_email),
    opt_sms: Boolean(row.opt_sms),
    birthday: asString(row.birthday),
    contact_status: asString(row.contact_status),
    membership_type: asString(row.membership_type),
    membership_id: asString(row.membership_id),
    avatar: asPhotoUrl(row.avatar),
    unit: asString(row.unit),
    address: asString(row.address),
    editable_fields: Array.isArray(row.editable_fields)
      ? row.editable_fields.map((item) => asString(item)).filter(Boolean)
      : [],
  };
}

export async function getProfile(userId?: number | string) {
  const qs = userId ? `?user_id=${encodeURIComponent(String(userId))}` : "";
  const res = await apiGet(`/api/wp/profile${qs}`);
  if (!res.ok) return { ok: false as const, item: null };
  const item = toProfile(res.data);
  return item
    ? { ok: true as const, item }
    : { ok: false as const, item: null };
}

import type {
  WarrantyChoice,
  WarrantyItem,
  WarrantyOptions,
  WarrantySummary,
  WarrantyVendor,
} from "@/lib/warranties";
import { warrantyBucketCounts } from "@/lib/warranties";
import { apiGet, queryString } from "./api";
import {
  asArray,
  asBoolean,
  asNumber,
  asPhotoUrl,
  asRecord,
  readListPayload,
} from "./validate";

const EMPTY: WarrantySummary = {
  open: 0,
  in_progress: 0,
  closed: 0,
  assigned: 0,
  expiring: 0,
};

function firstPhoto(row: Record<string, unknown>) {
  for (const key of [
    "avatar",
    "custom_avatar",
    "photo",
    "image",
    "picture",
    "logo",
  ]) {
    const url = asPhotoUrl(row[key]);
    if (url) return url;
  }
  return "";
}

export function mapWarrantyVendor(raw: unknown): WarrantyVendor | null {
  const row = asRecord(raw);
  if (!row) return null;
  const id = asNumber(row.id) || String(row.id || "");
  if (id === "" || id === "0") return null;
  return {
    id,
    label: String(row.label || row.company || "Vendor"),
    company: String(row.company || ""),
    address: String(row.address || row.subcon_company_address || ""),
    company_phone: String(row.company_phone || row.subcon_company_phone || ""),
    phone: String(row.phone || row.phonenumber || ""),
    mobile: String(row.mobile || row.mobilenumber || ""),
    email: String(row.email || row.ceo_email || ""),
    first_name: String(row.first_name || ""),
    last_name: String(row.last_name || ""),
    contact_name: String(row.contact_name || row.full_name || ""),
    salutation: String(row.salutation || ""),
    job_title: String(row.job_title || ""),
    rating: String(row.rating || ""),
    contact_type: String(row.contact_type || "Sub-Contractor"),
    coi_expiration: String(row.coi_expiration || row.subcon_coi_expiration || ""),
    payment_terms: String(row.payment_terms || row.subcon_payment_terms || ""),
    opt_email: asBoolean(row.opt_email),
    opt_sms: asBoolean(row.opt_sms),
    avatar: firstPhoto(row),
    can_edit: asBoolean(row.can_edit),
    trades: asArray(row.trades) as WarrantyChoice[],
    staff: asArray(row.staff).map((item) => {
      const staff = asRecord(item) || {};
      return {
        name: String(staff.name || ""),
        job_title: String(staff.job_title || ""),
        email: String(staff.email || ""),
        phone: String(staff.phone || ""),
        active: asBoolean(staff.active),
      };
    }),
  };
}

function uniqueClaims(items: WarrantyItem[]): WarrantyItem[] {
  const seen = new Set<number>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

export async function loadWarrantySummary(): Promise<WarrantySummary> {
  const [openItems, closedItems] = await Promise.all([
    loadAllWarrantyClaims("open"),
    loadAllWarrantyClaims("closed"),
  ]);
  return warrantyBucketCounts(uniqueClaims([...openItems, ...closedItems]));
}

export function emptyWarrantySummary(): WarrantySummary {
  return { ...EMPTY };
}

/** Staff lists: walk pages so tab counts match cards. Stops on a short page. */
export async function loadAllWarrantyClaims(
  status: "open" | "closed" | "all" | "expiring",
  input: { search?: string } = {}
): Promise<WarrantyItem[]> {
  const perPage = 200;
  const acc: WarrantyItem[] = [];
  for (let page = 1; page <= 20; page += 1) {
    const res = await loadWarrantyClaims(status, {
      search: input.search,
      perPage,
      page,
    });
    if (!res.items.length) break;
    acc.push(...res.items);
    if (res.items.length < perPage) break;
  }
  return uniqueClaims(acc);
}

export async function loadWarrantyClaims(
  status: "open" | "closed" | "all" | "expiring" = "open",
  input: { search?: string; perPage?: number; page?: number } = {}
): Promise<{ items: WarrantyItem[]; total: number }> {
  const qs = queryString({
    status,
    search: input.search,
    per_page: input.perPage ?? 20,
    page: input.page,
  });
  const result = await apiGet(`/api/wp/warranties?${qs}`);
  if (!result.ok) return { items: [], total: 0 };
  const payload = readListPayload(result.data);
  return {
    items: payload.items as WarrantyItem[],
    total: payload.total,
  };
}

export async function saveWarrantyPhotos(
  record: WarrantyItem,
  photoIds: number[]
): Promise<{ ok: boolean; message?: string }> {
  const res = await fetch(`/api/wp/warranties/${record.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      warranty_type: record.warranty_type,
      warranty_unit: record.warranty_unit,
      warranty_first_name: record.warranty_first_name,
      warranty_last_name: record.warranty_last_name,
      warranty_email_address: record.warranty_email_address,
      warranty_tel_number: record.warranty_tel_number,
      warranty_describe_the_request:
        record.warranty_describe_the_request_single ||
        record.warranty_describe_the_request,
      warranty_describe_the_request_single:
        record.warranty_describe_the_request_single ||
        record.warranty_describe_the_request,
      warranty_photo: photoIds,
    }),
  });
  const data = (await res.json()) as { message?: string };
  return { ok: res.ok, message: data.message };
}

export async function saveWarrantyVendor(
  vendorId: number | string,
  payload: Record<string, unknown>
): Promise<{ ok: boolean; message?: string; vendor: WarrantyVendor | null }> {
  const res = await fetch("/api/wp/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = (await res.json()) as { message?: string };
  return {
    ok: res.ok,
    message: data.message,
    vendor: res.ok
      ? mapWarrantyVendor({
          id: vendorId,
          ...payload,
        })
      : null,
  };
}

export async function loadWarrantyOptions(input: {
  subcontractorId?: number | string;
} = {}): Promise<WarrantyOptions | null> {
  const qs = queryString({
    lite: 1,
    subcontractor_id: input.subcontractorId,
  });
  const result = await apiGet(`/api/wp/warranties/options?${qs}`);
  if (!result.ok) return null;
  const row = asRecord(result.data);
  if (!row) return null;
  const vendor = mapWarrantyVendor(row.vendor);
  return {
    types: asArray(row.types) as WarrantyChoice[],
    units: asArray(row.units) as WarrantyChoice[],
    statuses: asArray(row.statuses) as WarrantyChoice[],
    locations: asArray(row.locations) as WarrantyChoice[],
    trades: asArray(row.trades) as WarrantyChoice[],
    subcontractors: asArray(row.subcontractors).map((item) => {
      const choice = asRecord(item) || {};
      return {
        id: asNumber(choice.id) || String(choice.id || ""),
        label: String(choice.label || choice.company || ""),
        avatar: firstPhoto(choice),
      };
    }),
    vendor,
    can_edit: Boolean(row.can_edit),
    can_create: Boolean(row.can_create),
    is_staff: Boolean(row.is_staff),
    current_user: asNumber(row.current_user),
    default_status_id: asNumber(row.default_status_id) || undefined,
  };
}

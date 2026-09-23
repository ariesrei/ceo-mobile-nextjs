import type {
  WarrantyChoice,
  WarrantyItem,
  WarrantyOptions,
  WarrantySummary,
  WarrantyVendor,
  WarrantyVendorOpenItem,
  WarrantyVendorStaff,
  WarrantyVendorTrade,
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
): Promise<{ ok: boolean; message?: string }> {
  const res = await fetch("/api/wp/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: vendorId,
      ...payload,
    }),
  });
  const data = (await res.json()) as { message?: string };
  return { ok: res.ok, message: data.message };
}

function mapVendorStaff(item: unknown): WarrantyVendorStaff {
  const person = asRecord(item) || {};
  return {
    name: String(person.name || ""),
    job_title: String(person.job_title || ""),
    email: String(person.email || ""),
    phone: String(person.phone || ""),
    active: asBoolean(person.active),
    notify:
      person.notify === undefined ? undefined : asBoolean(person.notify),
  };
}

function mapVendorTrade(item: unknown): WarrantyVendorTrade {
  const trade = asRecord(item) || {};
  return {
    id: asNumber(trade.id) || String(trade.id || ""),
    label: String(trade.label || ""),
    coverage: String(trade.coverage || ""),
    priority: String(trade.priority || ""),
    sla: String(trade.sla || ""),
    staff: asArray(trade.staff).map(mapVendorStaff),
  };
}

function mapVendorOpenItem(item: unknown): WarrantyVendorOpenItem {
  const row = asRecord(item) || {};
  return {
    type: String(row.type || "warranty"),
    type_label: String(row.type_label || ""),
    id: asNumber(row.id),
    unit: String(row.unit || ""),
    resident: String(row.resident || ""),
    status: String(row.status || ""),
    date: String(row.date || ""),
    due: String(row.due || ""),
    description: String(row.description || ""),
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
  const vendorRow = asRecord(row.vendor);
  const openItems = (
    asArray(vendorRow?.open_items).length
      ? asArray(vendorRow?.open_items)
      : asArray(row.open_items)
  ).map(mapVendorOpenItem);
  const vendor: WarrantyVendor | null = vendorRow
    ? {
        id: asNumber(vendorRow.id) || String(vendorRow.id || ""),
        label: String(vendorRow.label || vendorRow.company || "Vendor"),
        company: String(vendorRow.company || ""),
        address: String(vendorRow.address || vendorRow.subcon_company_address || ""),
        company_phone: String(
          vendorRow.company_phone || vendorRow.subcon_company_phone || ""
        ),
        phone: String(vendorRow.phone || vendorRow.phonenumber || ""),
        mobile: String(vendorRow.mobile || vendorRow.mobilenumber || ""),
        email: String(vendorRow.email || vendorRow.ceo_email || ""),
        first_name: String(vendorRow.first_name || ""),
        last_name: String(vendorRow.last_name || ""),
        contact_name: String(vendorRow.contact_name || vendorRow.full_name || ""),
        salutation: String(vendorRow.salutation || ""),
        job_title: String(vendorRow.job_title || ""),
        rating: String(vendorRow.rating || ""),
        contact_type: String(vendorRow.contact_type || "Sub-Contractor"),
        coi_expiration: String(
          vendorRow.coi_expiration || vendorRow.subcon_coi_expiration || ""
        ),
        payment_terms: String(
          vendorRow.payment_terms || vendorRow.subcon_payment_terms || ""
        ),
        opt_email: asBoolean(vendorRow.opt_email),
        opt_sms: asBoolean(vendorRow.opt_sms),
        avatar: asPhotoUrl(vendorRow.avatar),
        can_edit: asBoolean(vendorRow.can_edit),
        trades: (asArray(vendorRow.trades).length
          ? asArray(vendorRow.trades)
          : asArray(row.trades)
        ).map(mapVendorTrade),
        staff: asArray(vendorRow.staff).map(mapVendorStaff),
        open_items: openItems,
      }
    : null;
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
        avatar: asPhotoUrl(choice.avatar),
      };
    }),
    vendor,
    open_items: openItems,
    can_edit: Boolean(row.can_edit),
    can_create: Boolean(row.can_create),
    is_staff: Boolean(row.is_staff),
    current_user: asNumber(row.current_user),
    default_status_id: asNumber(row.default_status_id) || undefined,
  };
}

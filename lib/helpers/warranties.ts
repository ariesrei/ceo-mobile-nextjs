import type {
  WarrantyChoice,
  WarrantyItem,
  WarrantyOptions,
  WarrantySummary,
} from "@/lib/warranties";
import { warrantyBucketCounts } from "@/lib/warranties";
import { apiGet, queryString } from "./api";
import { asArray, asNumber, asRecord, readListPayload } from "./validate";

const EMPTY: WarrantySummary = {
  open: 0,
  in_progress: 0,
  closed: 0,
  assigned: 0,
  expiring: 0,
};

function asItems(raw: unknown): WarrantyItem[] {
  return asArray(readListPayload(raw).items) as WarrantyItem[];
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
  const [openRes, closedRes] = await Promise.all([
    apiGet("/api/wp/warranties?status=open&per_page=50"),
    apiGet("/api/wp/warranties?status=closed&per_page=50"),
  ]);

  const openItems = openRes.ok ? asItems(openRes.data) : [];
  const closedItems = closedRes.ok ? asItems(closedRes.data) : [];
  return warrantyBucketCounts(uniqueClaims([...openItems, ...closedItems]));
}

export function emptyWarrantySummary(): WarrantySummary {
  return { ...EMPTY };
}

export async function loadWarrantyClaims(
  status: "open" | "closed" | "all" = "open",
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

export async function loadWarrantyOptions(): Promise<WarrantyOptions | null> {
  const result = await apiGet("/api/wp/warranties/options?lite=1");
  if (!result.ok) return null;
  const row = asRecord(result.data);
  if (!row) return null;
  return {
    types: asArray(row.types) as WarrantyChoice[],
    units: asArray(row.units) as WarrantyChoice[],
    statuses: asArray(row.statuses) as WarrantyChoice[],
    locations: asArray(row.locations) as WarrantyChoice[],
    trades: asArray(row.trades) as WarrantyChoice[],
    subcontractors: asArray(row.subcontractors) as WarrantyChoice[],
    can_edit: Boolean(row.can_edit),
    can_create: Boolean(row.can_create),
    is_staff: Boolean(row.is_staff),
    current_user: asNumber(row.current_user),
    default_status_id: asNumber(row.default_status_id) || undefined,
  };
}

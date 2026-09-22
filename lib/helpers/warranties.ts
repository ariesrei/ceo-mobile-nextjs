import type {
  WarrantyChoice,
  WarrantyItem,
  WarrantyOptions,
  WarrantySummary,
} from "@/lib/warranties";
import {
  isWarrantyExpiring,
  isWarrantyInProgress,
} from "@/lib/warranties";
import { apiGet, queryString } from "./api";
import { asArray, asNumber, asRecord, readListPayload } from "./validate";

const EMPTY: WarrantySummary = {
  open: 0,
  in_progress: 0,
  closed: 0,
  assigned: 0,
  expiring: 0,
};

function fromSummaryRow(raw: unknown): WarrantySummary | null {
  const row = asRecord(raw);
  if (!row) return null;
  if (row.open == null && row.in_progress == null && row.closed == null) {
    return null;
  }
  return {
    open: asNumber(row.open),
    in_progress: asNumber(row.in_progress),
    closed: asNumber(row.closed),
    assigned: asNumber(row.assigned),
    expiring: asNumber(row.expiring),
  };
}

function asItems(raw: unknown): WarrantyItem[] {
  return asArray(readListPayload(raw).items) as WarrantyItem[];
}

export async function loadWarrantySummary(): Promise<WarrantySummary> {
  const direct = await apiGet("/api/wp/warranties/summary");
  if (direct.ok) {
    const stats = fromSummaryRow(direct.data);
    if (stats) return stats;
  }

  const [openRes, closedRes] = await Promise.all([
    apiGet("/api/wp/warranties?status=open&per_page=50"),
    apiGet("/api/wp/warranties?status=closed&per_page=50"),
  ]);

  const openItems = openRes.ok ? asItems(openRes.data) : [];
  const closedPayload = closedRes.ok ? readListPayload(closedRes.data) : null;

  return {
    open: openItems.filter((item) => !isWarrantyInProgress(item)).length,
    in_progress: openItems.filter((item) => isWarrantyInProgress(item)).length,
    closed: closedPayload?.total || 0,
    assigned: openItems.filter((item) => item.is_assigned).length,
    expiring: openItems.filter((item) => isWarrantyExpiring(item)).length,
  };
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

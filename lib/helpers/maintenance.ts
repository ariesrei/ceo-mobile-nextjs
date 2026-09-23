import type { MaintenanceItem, MaintenanceOptions, MaintenancePhoto } from "@/lib/maintenance";
import { apiGet, apiPost, queryString } from "./api";
import { AppError, formatAppError, validationError } from "./errors";
import {
  asArray,
  asBoolean,
  asNumber,
  asPhotoUrl,
  asRecord,
  asString,
  readListPayload,
} from "./validate";

export type MaintenanceStatus = "internal" | "external" | "completed" | "open" | "all";

export type MaintenanceListResult =
  | {
      ok: true;
      items: MaintenanceItem[];
      total: number;
      can_edit: boolean;
      can_create: boolean;
      show_completed_tab: boolean;
      is_staff?: boolean;
    }
  | {
      ok: false;
      items: [];
      total: 0;
      can_edit: false;
      can_create: false;
      show_completed_tab: false;
      is_staff?: undefined;
      error: AppError;
      message: string;
    };

function toPhoto(raw: unknown): MaintenancePhoto | null {
  const row = asRecord(raw);
  const url = asPhotoUrl(row?.url);
  if (!url) return null;
  return { id: asNumber(row?.id), url };
}

export function toMaintenanceItem(raw: unknown): MaintenanceItem | null {
  const row = asRecord(raw);
  const id = asNumber(row?.id);
  if (!row || id <= 0) return null;
  const photos = asArray(row.photos)
    .map(toPhoto)
    .filter((p): p is MaintenancePhoto => Boolean(p));
  return {
    id,
    title: asString(row.title),
    maintenance_type: asNumber(row.maintenance_type),
    type_label: asString(row.type_label),
    maintenance_priority: asString(row.maintenance_priority),
    maintenance_date_request: asString(row.maintenance_date_request),
    maintenance_request_by: asNumber(row.maintenance_request_by),
    request_by_name: asString(row.request_by_name),
    maintenance_description: asString(row.maintenance_description),
    maintenance_symptoms: asString(row.maintenance_symptoms),
    maintenance_unit: asNumber(row.maintenance_unit),
    unit_title: asString(row.unit_title),
    maintenance_location: asNumber(row.maintenance_location),
    location_label: asString(row.location_label),
    maintenance_department: asNumber(row.maintenance_department),
    department_label: asString(row.department_label),
    maintenance_source: asString(row.maintenance_source),
    maintenance_status: asNumber(row.maintenance_status),
    status_label: asString(row.status_label),
    maintenance_assigned_person: asNumber(row.maintenance_assigned_person),
    assigned_name: asString(row.assigned_name),
    maintenance_sources_subcontractors: asNumber(row.maintenance_sources_subcontractors) || undefined,
    subcontractor_name: asString(row.subcontractor_name) || undefined,
    photos,
    can_edit: asBoolean(row.can_edit),
  };
}

export async function listMaintenance(input: {
  status: MaintenanceStatus;
  scope?: "mine" | "building";
  search?: string;
  perPage?: number;
}): Promise<MaintenanceListResult> {
  const qs = queryString({
    status: input.status,
    scope: input.scope,
    per_page: input.perPage ?? 50,
    search: input.search,
  });
  const res = await apiGet(`/api/wp/maintenance?${qs}`);
  if (!res.ok) {
    return {
      ok: false,
      items: [],
      total: 0,
      can_edit: false,
      can_create: false,
      show_completed_tab: false,
      error: res.error,
      message: res.message,
    };
  }
  const payload = readListPayload(res.data);
  const items = payload.items
    .map(toMaintenanceItem)
    .filter((item): item is MaintenanceItem => Boolean(item));
  return {
    ok: true,
    items,
    total: payload.total || items.length,
    can_edit: payload.can_edit,
    can_create:
      payload.extra.can_create === undefined
        ? payload.can_edit
        : asBoolean(payload.extra.can_create),
    show_completed_tab: asBoolean(payload.extra.show_completed_tab),
    is_staff:
      payload.extra.is_staff === undefined
        ? undefined
        : asBoolean(payload.extra.is_staff),
  };
}

export async function countOpenMaintenance() {
  const list = await listMaintenance({ status: "internal", perPage: 1 });
  return list.ok ? list.total : 0;
}

export async function loadMaintenanceOptions(): Promise<MaintenanceOptions | null> {
  const res = await apiGet("/api/wp/maintenance/options");
  if (!res.ok) return null;
  const data = asRecord(res.data);
  if (!data) return null;
  return data as unknown as MaintenanceOptions;
}

export async function updateMaintenanceStatus(
  id: number,
  statusId: number
): Promise<{ ok: true } | { ok: false; error: AppError; message: string }> {
  if (id <= 0 || statusId <= 0) {
    const error = validationError("Status is required.");
    return { ok: false, error, message: formatAppError(error) };
  }
  const res = await apiPost(`/api/wp/maintenance/${id}/status`, {
    maintenance_status: statusId,
  });
  return res.ok ? { ok: true } : { ok: false, error: res.error, message: res.message };
}

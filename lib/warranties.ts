export type WarrantyChoice = { id: number | string; label: string };

export type WarrantyPhoto = {
  id: number;
  url: string;
};

export type WarrantyItem = {
  id: number;
  title: string;
  warranty_type: string;
  type_label: string;
  warranty_unit: number;
  unit_title: string;
  warranty_first_name: string;
  warranty_last_name: string;
  warranty_email_address: string;
  warranty_tel_number: string;
  warranty_describe_the_request?: string;
  warranty_describe_the_request_single?: string;
  warranty_location?: number[];
  warranty_location_single?: number[];
  location_labels?: string;
  warranty_entry_date: string;
  warranty_entry_start_time: string;
  warranty_entry_end_time: string;
  warranty_entry_notes: string;
  warranty_status: number;
  status_label: string;
  warranty_sources_trade: number[];
  trade_labels?: string[] | string;
  warranty_sources_target_due: string;
  warranty_sources_internal_note: string;
  warranty_sources_subcontractors?: number;
  subcontractor_name?: string;
  is_assigned?: boolean;
  resident_id: number;
  resident_name: string;
  /** Resident/contact profile photo. Empty when none is set. */
  avatar?: string;
  created_date: string;
  photos?: WarrantyPhoto[];
  can_edit?: boolean;
  is_closed?: boolean;
};

export type WarrantySummary = {
  open: number;
  in_progress: number;
  closed: number;
  assigned: number;
  expiring: number;
};

export type WarrantyListResponse = {
  items: WarrantyItem[];
  total: number;
  page: number;
  per_page: number;
  can_edit: boolean;
  can_create: boolean;
  is_staff: boolean;
  status: string;
};

export type WarrantyOptions = {
  types: WarrantyChoice[];
  units: WarrantyChoice[];
  statuses: WarrantyChoice[];
  locations?: WarrantyChoice[];
  trades: WarrantyChoice[];
  subcontractors?: WarrantyChoice[];
  can_edit: boolean;
  can_create: boolean;
  is_staff: boolean;
  current_user: number;
  default_status_id?: number;
  profile?: {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
  };
  unit_contact?: {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    user_id?: number;
  };
};

/** Native time input value (HH:mm) from ACF "g:i a" or other stored times. */
export function toTimeInputValue(value?: string): string {
  const raw = (value || "").trim();
  if (!raw) return "";
  const match12 = raw.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*([ap]m)$/i);
  if (match12) {
    let hour = Number(match12[1]);
    const minute = match12[2];
    const pm = match12[3].toLowerCase() === "pm";
    if (pm && hour < 12) hour += 12;
    if (!pm && hour === 12) hour = 0;
    return `${String(hour).padStart(2, "0")}:${minute}`;
  }
  const match24 = raw.match(/^(\d{1,2}):(\d{2})/);
  if (!match24) return "";
  return `${String(Number(match24[1])).padStart(2, "0")}:${match24[2]}`;
}

/** ACF time_picker format: 9:00 am */
export function fromTimeInputValue(value?: string): string {
  const raw = (value || "").trim();
  if (!raw) return "";
  const match = raw.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return raw;
  let hour = Number(match[1]);
  const minute = match[2];
  const suffix = hour >= 12 ? "pm" : "am";
  hour = hour % 12 || 12;
  return `${hour}:${minute} ${suffix}`;
}

export function isWarrantyClosed(w: WarrantyItem): boolean {
  if (w.is_closed) return true;
  const s = (w.status_label || "").toLowerCase();
  return (
    s.includes("closed") ||
    s.includes("complete") ||
    s.includes("claimed") ||
    s.includes("done")
  );
}

export function isWarrantyInProgress(w: WarrantyItem): boolean {
  if (isWarrantyClosed(w)) return false;
  const s = (w.status_label || "").toLowerCase();
  return s.includes("progress") || Boolean(w.is_assigned);
}

export function isWarrantyExpiring(w: WarrantyItem, withinDays = 45): boolean {
  const due = (w.warranty_sources_target_due || "").trim();
  if (!due || isWarrantyClosed(w)) return false;
  const parsed = new Date(due);
  if (Number.isNaN(parsed.getTime())) return false;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const limit = new Date(now);
  limit.setDate(limit.getDate() + withinDays);
  return parsed >= now && parsed <= limit;
}

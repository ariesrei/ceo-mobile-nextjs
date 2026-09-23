export type MaintenanceChoice = { id: number; label: string };

export type MaintenancePhoto = {
  id: number;
  url: string;
};

export type MaintenanceItem = {
  id: number;
  title: string;
  maintenance_type: number;
  type_label: string;
  maintenance_priority: string;
  maintenance_date_request: string;
  maintenance_request_by: number;
  request_by_name: string;
  maintenance_description: string;
  maintenance_symptoms: string;
  maintenance_unit: number;
  unit_title: string;
  maintenance_location: number;
  location_label: string;
  maintenance_department: number;
  department_label: string;
  maintenance_source: string;
  maintenance_status: number;
  status_label: string;
  maintenance_assigned_person: number;
  assigned_name: string;
  maintenance_sources_subcontractors?: number;
  subcontractor_name?: string;
  maintenance_sources_trade?: number[];
  trade_labels?: string[];
  maintenance_sources_target_due?: string;
  maintenance_sources_internal_note?: string;
  photos?: MaintenancePhoto[];
  can_edit?: boolean;
};

export type MaintenanceListResponse = {
  items: MaintenanceItem[];
  total: number;
  page: number;
  per_page: number;
  can_edit: boolean;
  can_create?: boolean;
  status: string;
  scope?: string;
  show_completed_tab?: boolean;
};

export type MaintenanceOptions = {
  units: MaintenanceChoice[];
  types: MaintenanceChoice[];
  statuses: MaintenanceChoice[];
  locations: MaintenanceChoice[];
  departments: MaintenanceChoice[];
  staff: MaintenanceChoice[];
  subcontractors?: MaintenanceChoice[];
  trades?: MaintenanceChoice[];
  priorities: string[];
  sources: string[];
  can_edit: boolean;
  can_create?: boolean;
  current_user: number;
  show_completed_tab?: boolean;
  is_staff?: boolean;
  default_status_id?: number;
};

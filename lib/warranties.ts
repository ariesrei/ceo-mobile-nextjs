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
  created_date: string;
  photos?: WarrantyPhoto[];
  can_edit?: boolean;
  is_closed?: boolean;
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

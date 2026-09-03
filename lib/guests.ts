export type GuestChoice = { id: number; label: string };

export type GuestPhoto = {
  id: number;
  url: string;
};

export type GuestItem = {
  id: number;
  title: string;
  guest_names: string;
  guest_phone: string;
  guest_number: number;
  guest_unit: number;
  unit_title: string;
  guest_current_resident?: number;
  resident_name: string;
  guest_contact_type?: number;
  guest_have_vehicle: boolean;
  guest_parking_stall?: string;
  guest_license_plate?: string;
  guest_car_make?: string;
  guest_car_model?: string;
  guest_car_color?: string;
  guest_car_year?: string;
  guest_check_in: string;
  guest_check_out: string;
  photos?: GuestPhoto[];
  status: "checked_in" | "checked_out" | string;
  can_edit?: boolean;
};

export type GuestListResponse = {
  items: GuestItem[];
  total: number;
  page: number;
  per_page: number;
  can_edit: boolean;
  status: string;
};

export type GuestOptions = {
  units: GuestChoice[];
  can_edit: boolean;
  current_user: number;
};

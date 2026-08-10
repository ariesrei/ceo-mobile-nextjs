export type ParcelChoice = { id: number; label: string };

export type ParcelPhoto = {
  id: number;
  url: string;
};

export type ParcelItem = {
  id: number;
  title: string;
  parcel_recipient: number;
  unit_title: string;
  parcel_resident: number;
  resident_name: string;
  parcel_type: number;
  parcel_type_label: string;
  parcel_type_other: string;
  parcel_received_by: number;
  received_by_name: string;
  parcel_number: number;
  comments_parcel_barcode: string;
  parcel_delivered_on: string;
  photos?: ParcelPhoto[];
  status: "in_storage" | "claimed" | string;
  parcel_pickup_type: string;
  can_edit?: boolean;
};

export type ParcelListResponse = {
  items: ParcelItem[];
  total: number;
  page: number;
  per_page: number;
  can_edit: boolean;
  status: string;
};

export type ParcelOptions = {
  units: ParcelChoice[];
  parcel_types: ParcelChoice[];
  staff: ParcelChoice[];
  residents: ParcelChoice[];
  pickup_types?: string[];
  can_edit: boolean;
  current_user: number;
};

export type ParcelSaveBody = {
  parcel_recipient: number;
  parcel_resident: number;
  parcel_type?: number;
  parcel_type_other?: string;
  parcel_received_by?: number;
  parcel_number?: number;
  comments_parcel_barcode?: string;
  parcel_delivered_on?: string;
  notify_email?: boolean;
  parcel_photo?: number[];
};

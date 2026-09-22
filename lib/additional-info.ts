export type Choice = { id: string | number; label: string };

export type PetItem = {
  id: number;
  type_id: number;
  type: string;
  pet_name: string;
  pet_breed: string;
  pet_dob: string;
  pet_microchip_number: string;
  pet_weight: string;
  service_animal: boolean;
  desc: string;
  photo_id?: number;
  photo?: string;
  status?: string;
  pending?: boolean;
};

export type VehicleItem = {
  id: number;
  year: string;
  make: string;
  model: string;
  color: string;
  license_plate: string;
  state: string;
  scantag: string;
  expiry: string;
  electric_vehicle: boolean;
  active: boolean;
  photo_id?: number;
  photo?: string;
  status?: string;
  pending?: boolean;
};

export type PreferenceItem = {
  id: number;
  category_id: number;
  subcategory_id: number;
  category: string;
  subcategory: string;
  type: string;
  types: string[];
  description: string;
  critical: boolean;
  visibility: string;
  status?: string;
  pending?: boolean;
};

export type AdditionalSections = {
  pets?: { enabled: boolean; items: PetItem[] };
  vehicles?: { enabled: boolean; items: VehicleItem[] };
  preferences?: { enabled: boolean; items: PreferenceItem[] };
};

"use client";

import type { PetItem, VehicleItem } from "@/lib/additional-info";
import { PetForm } from "./PetForm";
import { VehicleForm } from "./VehicleForm";

export function OpsPetEdit({ data }: { data: PetItem }) {
  return <PetForm pet={data} afterSaveHref="/account/assets" />;
}

export function OpsVehicleEdit({ data }: { data: VehicleItem }) {
  return <VehicleForm vehicle={data} afterSaveHref="/account/assets" />;
}

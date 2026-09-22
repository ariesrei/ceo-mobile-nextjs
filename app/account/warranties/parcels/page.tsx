import { redirect } from "next/navigation";

/** Stops `/account/warranties/[id]` from treating "parcels" as a claim. */
export default function WarrantyParcelsRedirectPage() {
  redirect("/account/parcels");
}

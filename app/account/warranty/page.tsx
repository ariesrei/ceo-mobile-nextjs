import { redirect } from "next/navigation";

/** Legacy path — staff menu uses /account/warranties. */
export default function WarrantyRedirectPage() {
  redirect("/account/warranties");
}

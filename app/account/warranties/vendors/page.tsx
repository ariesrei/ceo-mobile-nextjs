import { redirect } from "next/navigation";
import { WarrantyShell } from "@/components/WarrantyShell";
import { WarrantyVendorList } from "@/components/WarrantyVendorList";
import { getNavigation, isStaffMenuPath } from "@/lib/server-nav";

export default async function WarrantyVendorsPage() {
  const nav = await getNavigation();
  /* Subcontractors are only returned to staff by /app/warranties/options, so a
     resident reaching this URL would get an empty screen rather than a denial.
     Same guard the other staff-only warranty screens use. */
  if (!isStaffMenuPath(nav, "/account/warranties")) {
    redirect("/account/warranties");
  }

  return (
    <WarrantyShell title="Vendors" backHref="/account/warranties">
      <WarrantyVendorList />
    </WarrantyShell>
  );
}

import { redirect } from "next/navigation";
import { WarrantyShell } from "@/components/WarrantyShell";
import { WarrantyStaffGate } from "@/components/WarrantyStaffGate";
import { WarrantyVendorList } from "@/components/WarrantyVendorList";
import { getNavigation, staffMenuDecision } from "@/lib/server-nav";

export default async function WarrantyVendorsPage() {
  const nav = await getNavigation();
  const decision = staffMenuDecision(nav, "/account/warranties");
  if (decision === "resident") {
    redirect("/account/warranties");
  }

  return (
    <WarrantyShell title="Vendors" backHref="/account/warranties">
      <WarrantyStaffGate
        confirmed={decision === "staff"}
        fallbackHref="/account/warranties"
      >
        <WarrantyVendorList />
      </WarrantyStaffGate>
    </WarrantyShell>
  );
}

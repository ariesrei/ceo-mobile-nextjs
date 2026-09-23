import { redirect } from "next/navigation";
import { WarrantyShell } from "@/components/WarrantyShell";
import { WarrantyStaffGate } from "@/components/WarrantyStaffGate";
import { WarrantyVendorProfile } from "@/components/WarrantyVendorProfile";
import { getNavigation, staffMenuDecision } from "@/lib/server-nav";

type Props = { params: Promise<{ id: string }> };

export default async function WarrantyVendorPage({ params }: Props) {
  const nav = await getNavigation();
  const decision = staffMenuDecision(nav, "/account/warranties");
  if (decision === "resident") {
    redirect("/account/warranties");
  }
  const { id } = await params;

  return (
    <WarrantyShell title="Vendor" backHref="/account/warranties/vendors">
      <WarrantyStaffGate
        confirmed={decision === "staff"}
        fallbackHref="/account/warranties"
      >
        <WarrantyVendorProfile vendorId={id} />
      </WarrantyStaffGate>
    </WarrantyShell>
  );
}

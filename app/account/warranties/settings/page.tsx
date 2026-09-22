import { redirect } from "next/navigation";
import { WarrantySettings } from "@/components/WarrantySettings";
import { WarrantyShell } from "@/components/WarrantyShell";
import { WarrantyStaffGate } from "@/components/WarrantyStaffGate";
import { getNavigation, staffMenuDecision } from "@/lib/server-nav";

export default async function WarrantySettingsPage() {
  const nav = await getNavigation();
  const decision = staffMenuDecision(nav, "/account/warranties");
  if (decision === "resident") {
    redirect("/account/warranties");
  }

  return (
    <WarrantyShell title="Warranty Settings" backHref="/account/warranties">
      <WarrantyStaffGate
        confirmed={decision === "staff"}
        fallbackHref="/account/warranties"
      >
        <WarrantySettings />
      </WarrantyStaffGate>
    </WarrantyShell>
  );
}

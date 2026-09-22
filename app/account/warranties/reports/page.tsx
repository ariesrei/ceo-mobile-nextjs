import { redirect } from "next/navigation";
import { WarrantyReports } from "@/components/WarrantyReports";
import { WarrantyShell } from "@/components/WarrantyShell";
import { WarrantyStaffGate } from "@/components/WarrantyStaffGate";
import { getNavigation, staffMenuDecision } from "@/lib/server-nav";

export default async function WarrantyReportsPage() {
  const nav = await getNavigation();
  const decision = staffMenuDecision(nav, "/account/warranties");
  if (decision === "resident") {
    redirect("/account/warranties");
  }

  return (
    <WarrantyShell title="Reports" backHref="/account/warranties">
      <WarrantyStaffGate
        confirmed={decision === "staff"}
        fallbackHref="/account/warranties"
      >
        <WarrantyReports />
      </WarrantyStaffGate>
    </WarrantyShell>
  );
}

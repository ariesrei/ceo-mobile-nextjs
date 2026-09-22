import { redirect } from "next/navigation";
import { WarrantyReports } from "@/components/WarrantyReports";
import { WarrantyShell } from "@/components/WarrantyShell";
import { getNavigation, isStaffMenuPath } from "@/lib/server-nav";

export default async function WarrantyReportsPage() {
  const nav = await getNavigation();
  if (!isStaffMenuPath(nav, "/account/warranties")) {
    redirect("/account/warranties");
  }

  return (
    <WarrantyShell title="Reports" backHref="/account/warranties">
      <WarrantyReports />
    </WarrantyShell>
  );
}

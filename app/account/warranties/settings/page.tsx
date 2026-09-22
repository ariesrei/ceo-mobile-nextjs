import { redirect } from "next/navigation";
import { WarrantySettings } from "@/components/WarrantySettings";
import { WarrantyShell } from "@/components/WarrantyShell";
import { getNavigation, isStaffMenuPath } from "@/lib/server-nav";

export default async function WarrantySettingsPage() {
  const nav = await getNavigation();
  if (!isStaffMenuPath(nav, "/account/warranties")) {
    redirect("/account/warranties");
  }

  return (
    <WarrantyShell title="Warranty Settings" backHref="/account/warranties">
      <WarrantySettings />
    </WarrantyShell>
  );
}

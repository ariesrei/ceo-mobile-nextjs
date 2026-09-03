import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/Card";
import { ParcelForm } from "@/components/ParcelForm";
import {
  getServerClientBranding,
  isStaffMenuPath,
  requireMenuPath,
} from "@/lib/server-nav";
import { redirect } from "next/navigation";

export default async function NewParcelPage() {
  const nav = await requireMenuPath("/account/parcels");
  if (!isStaffMenuPath(nav, "/account/parcels")) {
    redirect("/account/parcels");
  }
  const branding = await getServerClientBranding();

  return (
    <AppShell
      title="New parcel"
      subtitle="Log a delivery for a unit"
      backHref="/account/parcels"
      clientName={branding.name}
      clientLogo={branding.logo}
    >
      <Card>
        <ParcelForm />
      </Card>
    </AppShell>
  );
}

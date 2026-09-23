import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/Card";
import { ParcelForm } from "@/components/ParcelForm";
import { StaffPathGate } from "@/components/StaffPathGate";
import {
  getServerClientBranding,
  requireMenuPath,
  staffMenuDecision,
} from "@/lib/server-nav";
import { redirect } from "next/navigation";

export default async function NewParcelPage() {
  const nav = await requireMenuPath("/account/parcels");
  const decision = staffMenuDecision(nav, "/account/parcels");
  if (decision === "resident") {
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
      <StaffPathGate
        path="/account/parcels"
        confirmed={decision === "staff" || decision === "unknown"}
        fallbackHref="/account/parcels"
      >
        <Card>
          <ParcelForm />
        </Card>
      </StaffPathGate>
    </AppShell>
  );
}

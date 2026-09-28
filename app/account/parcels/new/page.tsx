import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/Card";
import { ParcelForm } from "@/components/ParcelForm";
import { StaffPathGate } from "@/components/StaffPathGate";
import {
  getServerClientBranding,
  requireMenuPath,
  staffMenuDecision,
} from "@/lib/server-nav";
import { showOpsAssetsUi } from "@/lib/app-profile";
import { redirect } from "next/navigation";

export default async function NewParcelPage({
  searchParams,
}: {
  searchParams: Promise<{ ocr?: string }>;
}) {
  const nav = await requireMenuPath("/account/parcels");
  const decision = staffMenuDecision(nav, "/account/parcels");
  if (decision === "resident") {
    redirect("/account/parcels");
  }
  const [branding, query] = await Promise.all([
    getServerClientBranding(),
    searchParams,
  ]);
  const community = showOpsAssetsUi();

  return (
    <AppShell
      title="New package"
      subtitle="Log a delivery for a unit"
      backHref="/account/parcels"
      layout={community ? "community" : "default"}
      clientName={branding.name}
      clientLogo={branding.logo}
    >
      <StaffPathGate
        path="/account/parcels"
        confirmed={decision === "staff" || decision === "unknown"}
        fallbackHref="/account/parcels"
      >
        <Card>
          <ParcelForm autoStartOcr={query.ocr === "1"} />
        </Card>
      </StaffPathGate>
    </AppShell>
  );
}

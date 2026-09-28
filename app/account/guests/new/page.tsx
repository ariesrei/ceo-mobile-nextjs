import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/Card";
import { GuestForm } from "@/components/GuestForm";
import { StaffPathGate } from "@/components/StaffPathGate";
import {
  getServerClientBranding,
  requireMenuPath,
  staffMenuDecision,
} from "@/lib/server-nav";
import { redirect } from "next/navigation";

export default async function NewGuestPage() {
  const nav = await requireMenuPath("/account/guests");
  const decision = staffMenuDecision(nav, "/account/guests");
  if (decision === "resident") {
    redirect("/account/history?tab=guests");
  }
  const branding = await getServerClientBranding();

  return (
    <AppShell
      title="New guest"
      subtitle="Check in a visitor for a unit"
      backHref="/account/guests"
      clientName={branding.name}
      clientLogo={branding.logo}
    >
      <StaffPathGate
        path="/account/guests"
        confirmed={decision === "staff" || decision === "unknown"}
        fallbackHref="/account/history?tab=guests"
      >
        <Card>
          <GuestForm />
        </Card>
      </StaffPathGate>
    </AppShell>
  );
}

import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/Card";
import { GuestForm } from "@/components/GuestForm";
import { getServerClientBranding, requireMenuPath } from "@/lib/server-nav";

export default async function NewGuestPage() {
  await requireMenuPath("/account/guests");
  const branding = await getServerClientBranding();

  return (
    <AppShell
      title="New guest"
      subtitle="Check in a visitor for a unit"
      backHref="/account/guests"
      clientName={branding.name}
      clientLogo={branding.logo}
    >
      <Card>
        <GuestForm />
      </Card>
    </AppShell>
  );
}

import { AppShell } from "@/components/AppShell";
import { EventsBoard } from "@/components/EventsBoard";
import { getServerClientBranding, requireAuth } from "@/lib/server-nav";

export default async function EventsPage() {
  await requireAuth();
  const branding = await getServerClientBranding();

  return (
    <AppShell
      title="Events"
      layout="community"
      clientName={branding.name}
      clientLogo={branding.logo}
    >
      <EventsBoard />
    </AppShell>
  );
}

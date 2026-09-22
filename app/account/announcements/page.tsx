import { AnnouncementsBoard } from "@/components/AnnouncementsBoard";
import { AppShell } from "@/components/AppShell";
import { getServerClientBranding, requireAuth } from "@/lib/server-nav";

export default async function AnnouncementsPage() {
  await requireAuth();
  const branding = await getServerClientBranding();

  return (
    <AppShell
      title="Announcements"
      layout="community"
      clientName={branding.name}
      clientLogo={branding.logo}
    >
      <AnnouncementsBoard />
    </AppShell>
  );
}

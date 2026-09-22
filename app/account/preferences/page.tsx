import { AppShell } from "@/components/AppShell";
import { PreferencesBoard } from "@/components/PreferencesBoard";
import { getServerClientBranding, requireAuth } from "@/lib/server-nav";

export default async function PreferencesPage() {
  await requireAuth();
  const branding = await getServerClientBranding();

  return (
    <AppShell
      title="My Preferences"
      layout="community"
      clientName={branding.name}
      clientLogo={branding.logo}
    >
      <PreferencesBoard />
    </AppShell>
  );
}

import { AppShell } from "@/components/AppShell";
import { ClassifiedsBoard } from "@/components/ClassifiedsBoard";
import { getServerClientBranding, requireAuth } from "@/lib/server-nav";

export default async function ClassifiedsPage() {
  await requireAuth();
  const branding = await getServerClientBranding();

  return (
    <AppShell
      title="Classifieds"
      layout="community"
      clientName={branding.name}
      clientLogo={branding.logo}
    >
      <ClassifiedsBoard />
    </AppShell>
  );
}

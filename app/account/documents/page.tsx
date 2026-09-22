import { AppShell } from "@/components/AppShell";
import { DocumentsBoard } from "@/components/DocumentsBoard";
import { getServerClientBranding, requireAuth } from "@/lib/server-nav";

export default async function DocumentsPage() {
  await requireAuth();
  const branding = await getServerClientBranding();

  return (
    <AppShell
      title="My Documents"
      layout="community"
      clientName={branding.name}
      clientLogo={branding.logo}
    >
      <DocumentsBoard />
    </AppShell>
  );
}

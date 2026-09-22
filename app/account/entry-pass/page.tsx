import { AppShell } from "@/components/AppShell";
import { EntryPassBoard } from "@/components/EntryPassBoard";
import { showOpsAssetsUi } from "@/lib/app-profile";
import { getServerClientBranding, requireAuth } from "@/lib/server-nav";
import { redirect } from "next/navigation";

export default async function EntryPassPage() {
  await requireAuth();
  if (!showOpsAssetsUi()) redirect("/account/guests");
  const branding = await getServerClientBranding();

  return (
    <AppShell
      title="Unit Entry Authorization"
      layout="community"
      clientName={branding.name}
      clientLogo={branding.logo}
    >
      <EntryPassBoard />
    </AppShell>
  );
}

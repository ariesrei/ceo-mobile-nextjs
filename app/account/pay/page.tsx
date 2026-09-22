import { AppShell } from "@/components/AppShell";
import { ComingSoonBoard } from "@/components/ComingSoonBoard";
import { showOpsAssetsUi } from "@/lib/app-profile";
import { getServerClientBranding, requireAuth } from "@/lib/server-nav";

export default async function PayBalancePage() {
  await requireAuth();
  const branding = await getServerClientBranding();
  const community = showOpsAssetsUi();

  return (
    <AppShell
      title="Pay Balance"
      subtitle={community ? undefined : "HOA payments"}
      backHref={community ? undefined : "/account"}
      layout={community ? "community" : "default"}
      clientName={branding.name}
      clientLogo={branding.logo}
    >
      <ComingSoonBoard
        kind="pay"
        copy="Pay Balance isn’t available yet. Your real account balance will show here when payments are ready."
      />
    </AppShell>
  );
}

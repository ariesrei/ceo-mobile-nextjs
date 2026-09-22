import { AccountMenu } from "@/components/AccountMenu";
import { AppShell } from "@/components/AppShell";
import { showOpsAssetsUi } from "@/lib/app-profile";
import { QUICK_ACTION_ITEMS } from "@/lib/helpers/shortcuts";
import { getServerClientBranding, requireAuth } from "@/lib/server-nav";

export default async function QuickActionsPage() {
  await requireAuth();
  const branding = await getServerClientBranding();
  const community = showOpsAssetsUi();

  return (
    <AppShell
      title="Quick Actions"
      subtitle={community ? undefined : "Community shortcuts"}
      backHref={community ? undefined : "/account"}
      layout={community ? "community" : "default"}
      clientName={branding.name}
      clientLogo={branding.logo}
    >
      <section className="ceo-ops-panel ceo-ops-panel--actions ceo-ops-panel--actions-page is-open">
        <AccountMenu menus={QUICK_ACTION_ITEMS} variant="actions" />
      </section>
    </AppShell>
  );
}

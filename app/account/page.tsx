import { AccountMenu } from "@/components/AccountMenu";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/Card";
import { getNavigation, getServerClientBranding, requireAuth } from "@/lib/server-nav";
import { wpFetchServer } from "@/lib/wp";
import type { AppUser } from "@/lib/types";

export default async function AccountPage() {
  await requireAuth();
  const [nav, me, branding] = await Promise.all([
    getNavigation(),
    wpFetchServer<AppUser>("/app/me"),
    getServerClientBranding(),
  ]);

  const user = me.data;
  const subtitle = user
    ? `${user.display_name} · ${user.role_primary.replace(/_/g, " ")}`
    : "My Account";
  const clientName = user?.client_name?.trim() || branding.name;
  const clientLogo = user?.client_logo?.trim() || branding.logo;

  return (
    <AppShell
      title="My Account"
      subtitle={subtitle}
      clientName={clientName}
      clientLogo={clientLogo}
    >
      {nav ? (
        <AccountMenu menus={nav.menus} />
      ) : (
        <Card>
          <p className="text-sm text-red-700">
            {me.error || "Could not load navigation."}
          </p>
        </Card>
      )}
    </AppShell>
  );
}

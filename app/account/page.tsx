import { HomeScreen } from "@/components/HomeScreen";
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
  const clientName = user?.client_name?.trim() || branding.name;
  const clientLogo = user?.client_logo?.trim() || branding.logo;
  const clientHero = user?.client_hero?.trim() || branding.hero;

  if (!nav) {
    return (
      <div className="ceo-app mx-auto min-h-dvh w-full px-[var(--app-pad)] py-10">
        <Card>
          <p className="text-sm text-[var(--danger)]">
            {me.error || "Could not load navigation."}
          </p>
        </Card>
      </div>
    );
  }

  return (
    <HomeScreen
      menus={nav.menus}
      clientName={clientName}
      clientLogo={clientLogo}
      clientHero={clientHero}
      displayName={user?.display_name}
      firstName={user?.first_name}
    />
  );
}

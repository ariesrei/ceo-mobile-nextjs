import { HomeScreen } from "@/components/HomeScreen";
import { Card } from "@/components/ui/Card";
import { normalizeAppProfile } from "@/lib/app-profile";
import { getNavigation, getServerAppProfile, getServerClientBranding, requireAuth } from "@/lib/server-nav";
import { wpFetchServer } from "@/lib/wp";
import type { AppUser } from "@/lib/types";

export default async function AccountPage() {
  await requireAuth();
  const [nav, me, branding, buildProfile] = await Promise.all([
    getNavigation(),
    wpFetchServer<AppUser>("/app/me"),
    getServerClientBranding(),
    getServerAppProfile(),
  ]);
  const appProfile =
    normalizeAppProfile(me?.data?.app_profile) ||
    normalizeAppProfile(nav?.app_profile) ||
    buildProfile;

  const user = me?.data;
  const clientName = user?.client_name?.trim() || branding?.name || "";
  const clientLogo = user?.client_logo?.trim() || branding?.logo || "";
  const clientHero = user?.client_hero?.trim() || branding?.hero || "";

  if (!nav) {
    return (
      <div className="ceo-app mx-auto min-h-dvh w-full px-[var(--app-pad)] py-10">
        <Card>
          <p className="text-sm text-[var(--danger)]">
            Could not load navigation.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <HomeScreen
      menus={nav.menus || []}
      clientName={clientName}
      clientLogo={clientLogo}
      clientHero={clientHero}
      displayName={user?.display_name}
      firstName={user?.first_name}
      appProfile={appProfile}
    />
  );
}

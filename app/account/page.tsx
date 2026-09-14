import { cookies } from "next/headers";
import { HomeScreen } from "@/components/HomeScreen";
import { Card } from "@/components/ui/Card";
import { getNavigation, getServerClientBranding, requireAuth } from "@/lib/server-nav";
import { COOKIE_FIRST_NAME } from "@/lib/wp";

export default async function AccountPage() {
  await requireAuth();
  const [nav, branding, jar] = await Promise.all([
    getNavigation(),
    getServerClientBranding(),
    cookies(),
  ]);
  const firstName = jar.get(COOKIE_FIRST_NAME)?.value?.trim() || "";

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
      menus={nav.menus}
      clientName={branding.name}
      clientLogo={branding.logo}
      clientHero={branding.hero}
      firstName={firstName}
    />
  );
}

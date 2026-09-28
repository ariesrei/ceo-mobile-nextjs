import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { HomeScreen } from "@/components/HomeScreen";
import { landsOnWarrantyHome } from "@/lib/app-profile";
import { getAccountAppProfile, getNavigation, getServerClientBranding, requireAuth } from "@/lib/server-nav";
import { COOKIE_FIRST_NAME, wpFetchServer } from "@/lib/wp";
import type { AppUser } from "@/lib/types";

export default async function AccountPage() {
  await requireAuth();
  const [nav, me, branding, appProfile, jar] = await Promise.all([
    getNavigation(),
    wpFetchServer<AppUser>("/app/me"),
    getServerClientBranding(),
    getAccountAppProfile(),
    cookies(),
  ]);

  if (landsOnWarrantyHome(appProfile)) {
    redirect("/account/warranties");
  }

  const user = me?.data;
  const clientName = user?.client_name?.trim() || branding?.name || "";
  const clientLogo = user?.client_logo?.trim() || branding?.logo || "";
  const clientHero = user?.client_hero?.trim() || branding?.hero || "";
  const menus = nav?.upstream_blocked ? [] : nav?.menus || [];

  return (
    <HomeScreen
      menus={menus}
      clientName={clientName}
      clientLogo={clientLogo}
      clientHero={clientHero}
      displayName={user?.display_name}
      firstName={user?.first_name || jar.get(COOKIE_FIRST_NAME)?.value || ""}
      appProfile={appProfile}
    />
  );
}

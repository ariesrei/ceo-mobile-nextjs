import { AppShell } from "@/components/AppShell";
import { ProfileBoard } from "@/components/ProfileBoard";
import { WarrantyShell } from "@/components/WarrantyShell";
import {
  COOKIE_WARRANTY_CHROME,
  keepWarrantyChrome,
  showOpsCommunityUi,
} from "@/lib/app-profile";
import {
  getServerAppProfile,
  getServerClientBranding,
  requireAuth,
} from "@/lib/server-nav";
import { cookies } from "next/headers";

type Props = { searchParams?: Promise<{ from?: string }> };

export default async function ProfilePage({ searchParams }: Props) {
  const profile = await getServerAppProfile();
  const from = (await searchParams)?.from;
  const chromeCookie = (await cookies()).get(COOKIE_WARRANTY_CHROME)?.value;
  const warrantyChrome = keepWarrantyChrome(from, chromeCookie);

  await requireAuth();

  if (showOpsCommunityUi(profile) && !warrantyChrome) {
    const branding = await getServerClientBranding();
    return (
      <AppShell
        title="My Profile"
        layout="community"
        clientName={branding.name}
        clientLogo={branding.logo}
      >
        <ProfileBoard />
      </AppShell>
    );
  }

  return (
    <WarrantyShell title="My Profile" backHref="/account/warranties">
      <ProfileBoard editHref="/account/edit?from=warranty" />
    </WarrantyShell>
  );
}

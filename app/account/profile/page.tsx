import { AppShell } from "@/components/AppShell";
import { ProfileBoard } from "@/components/ProfileBoard";
import { WarrantyShell } from "@/components/WarrantyShell";
import { keepWarrantyChrome, showOpsCommunityUi } from "@/lib/app-profile";
import {
  getServerAppProfile,
  getServerClientBranding,
  requireAuth,
} from "@/lib/server-nav";

type Props = { searchParams?: Promise<{ from?: string }> };

export default async function ProfilePage({ searchParams }: Props) {
  const profile = await getServerAppProfile();
  const from = (await searchParams)?.from;
  const warrantyChrome = keepWarrantyChrome(from);

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
      <ProfileBoard />
    </WarrantyShell>
  );
}

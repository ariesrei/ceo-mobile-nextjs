import { AppShell } from "@/components/AppShell";
import { ProfileBoard } from "@/components/ProfileBoard";
import { WarrantyShell } from "@/components/WarrantyShell";
import { keepWarrantyChrome } from "@/lib/app-profile";
import {
  getAccountAppProfile,
  getServerClientBranding,
  requireAuth,
} from "@/lib/server-nav";

type Props = { searchParams?: Promise<{ from?: string }> };

export default async function ProfilePage({ searchParams }: Props) {
  await requireAuth();
  const session = await getAccountAppProfile();
  const from = (await searchParams)?.from;

  if (keepWarrantyChrome(from, session)) {
    return (
      <WarrantyShell title="My Profile" backHref="/account/warranties">
        <ProfileBoard />
      </WarrantyShell>
    );
  }

  const branding = await getServerClientBranding();
  return (
    <AppShell
      title="My Profile"
      layout="community"
      clientName={branding.name}
      clientLogo={branding.logo}
      appProfile={session}
    >
      <ProfileBoard />
    </AppShell>
  );
}

import { AppShell } from "@/components/AppShell";
import { ProfileBoard } from "@/components/ProfileBoard";
import { WarrantyShell } from "@/components/WarrantyShell";
import { keepWarrantyChrome } from "@/lib/app-profile";
import {
  getAccountAppProfile,
  getServerClientBranding,
  requireAuth,
} from "@/lib/server-nav";

type Props = { searchParams?: Promise<{ from?: string; user_id?: string }> };

export default async function ProfilePage({ searchParams }: Props) {
  await requireAuth();
  const session = await getAccountAppProfile();
  const params = await searchParams;
  const from = params?.from;
  const title = params?.user_id ? "Profile" : "My Profile";

  if (keepWarrantyChrome(from, session)) {
    return (
      <WarrantyShell title={title} backHref="/account/warranties">
        <ProfileBoard userId={params?.user_id} />
      </WarrantyShell>
    );
  }

  const branding = await getServerClientBranding();
  return (
    <AppShell
      title={title}
      layout="community"
      clientName={branding.name}
      clientLogo={branding.logo}
      appProfile={session}
    >
      <ProfileBoard userId={params?.user_id} />
    </AppShell>
  );
}

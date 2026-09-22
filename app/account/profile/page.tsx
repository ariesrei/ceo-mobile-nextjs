import { AppShell } from "@/components/AppShell";
import { ClientWpRecord } from "@/components/ClientWpRecord";
import { ProfileBoard } from "@/components/ProfileBoard";
import { ProfileView } from "@/components/wp-record-views";
import { showOpsCommunityUi } from "@/lib/app-profile";
import {
  getServerAppProfile,
  getServerClientBranding,
  getServerClientName,
  requireAuth,
  requireMenuPath,
} from "@/lib/server-nav";
import { wpFetchServer } from "@/lib/wp";
import type { Profile } from "@/lib/types";

export default async function ProfilePage() {
  const profile = await getServerAppProfile();
  if (showOpsCommunityUi(profile)) {
    await requireAuth();
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

  await requireMenuPath("/account/profile");
  const [result, clientName] = await Promise.all([
    wpFetchServer<Profile>("/app/profile"),
    getServerClientName(),
  ]);

  return (
    <AppShell title="My Profile" backHref="/account" clientName={clientName}>
      <ClientWpRecord
        path="/profile"
        initial={result.data}
        error={result.error}
        as={ProfileView}
      />
    </AppShell>
  );
}

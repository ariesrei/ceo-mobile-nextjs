import { AppShell } from "@/components/AppShell";
import { ClientWpRecord } from "@/components/ClientWpRecord";
import { EditProfileView } from "@/components/wp-record-views";
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

export default async function EditProfilePage() {
  const profile = await getServerAppProfile();
  const [result, branding, clientName] = await Promise.all([
    wpFetchServer<Profile>("/app/profile"),
    getServerClientBranding(),
    getServerClientName(),
  ]);

  if (showOpsCommunityUi(profile)) {
    await requireAuth();
    return (
      <AppShell
        title="Edit Profile"
        layout="community"
        backHref="/account/profile"
        clientName={branding.name}
        clientLogo={branding.logo}
      >
        <ClientWpRecord
          path="/profile"
          initial={result.data}
          error={result.error || "Profile unavailable."}
          as={EditProfileView}
        />
      </AppShell>
    );
  }

  await requireMenuPath("/account/edit");
  return (
    <AppShell
      title="Edit Profile"
      subtitle="Changes may require staff approval."
      backHref="/account/profile"
      clientName={clientName}
    >
      <ClientWpRecord
        path="/profile"
        initial={result.data}
        error={result.error || "Profile unavailable."}
        as={EditProfileView}
      />
    </AppShell>
  );
}

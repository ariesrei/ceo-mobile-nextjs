import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/Card";
import { ClientWpRecord } from "@/components/ClientWpRecord";
import { EditProfileForm } from "@/components/EditProfileForm";
import { getServerClientName, requireMenuPath } from "@/lib/server-nav";
import { wpFetchServer } from "@/lib/wp";
import type { Profile } from "@/lib/types";

export default async function EditProfilePage() {
  await requireMenuPath("/account/edit");
  const [result, clientName] = await Promise.all([
    wpFetchServer<Profile>("/app/profile"),
    getServerClientName(),
  ]);

  return (
    <AppShell
      title="Edit Profile"
      subtitle="Changes may require staff approval."
      backHref="/account/profile"
      clientName={clientName}
    >
      <ClientWpRecord<Profile>
        path="/profile"
        initial={result.data}
        error={result.error || "Profile unavailable."}
      >
        {(profile) => (
          <Card>
            <EditProfileForm profile={profile} />
          </Card>
        )}
      </ClientWpRecord>
    </AppShell>
  );
}

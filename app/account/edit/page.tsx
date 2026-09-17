import { AppShell } from "@/components/AppShell";
import { ClientWpRecord } from "@/components/ClientWpRecord";
import { EditProfileView } from "@/components/wp-record-views";
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
      <ClientWpRecord
        path="/profile"
        initial={result.data}
        error={result.error || "Profile unavailable."}
        as={EditProfileView}
      />
    </AppShell>
  );
}

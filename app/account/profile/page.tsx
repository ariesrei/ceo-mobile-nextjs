import { AppShell } from "@/components/AppShell";
import { ClientWpRecord } from "@/components/ClientWpRecord";
import { ProfileView } from "@/components/wp-record-views";
import { getServerClientName, requireMenuPath } from "@/lib/server-nav";
import { wpFetchServer } from "@/lib/wp";
import type { Profile } from "@/lib/types";

export default async function ProfilePage() {
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

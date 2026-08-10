import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/Card";
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
      backHref="/account"
      clientName={clientName}
    >
      {!result.data ? (
        <Card>
          <p className="text-sm text-red-700">{result.error || "Profile unavailable."}</p>
        </Card>
      ) : (
        <Card>
          <EditProfileForm profile={result.data} />
        </Card>
      )}
    </AppShell>
  );
}

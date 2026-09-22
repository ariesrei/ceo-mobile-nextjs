import { AppShell } from "@/components/AppShell";
import { GuestForm } from "@/components/GuestForm";
import { showOpsAssetsUi } from "@/lib/app-profile";
import { getServerClientBranding, requireAuth } from "@/lib/server-nav";
import { redirect } from "next/navigation";

export default async function NewEntryPassPage() {
  await requireAuth();
  if (!showOpsAssetsUi()) redirect("/account/guests/new");
  const branding = await getServerClientBranding();

  return (
    <AppShell
      title="Create a New Pass"
      subtitle="Grant access to a guest."
      layout="community"
      backHref="/account/entry-pass"
      clientName={branding.name}
      clientLogo={branding.logo}
    >
      <GuestForm afterSaveHref="/account/entry-pass" />
    </AppShell>
  );
}

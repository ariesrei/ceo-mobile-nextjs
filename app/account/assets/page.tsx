import { AssetsBoard } from "@/components/AssetsBoard";
import { AppShell } from "@/components/AppShell";
import { showOpsAssetsUi } from "@/lib/app-profile";
import { getServerClientBranding, requireAuth } from "@/lib/server-nav";
import { redirect } from "next/navigation";

export default async function AssetsPage() {
  await requireAuth();
  if (!showOpsAssetsUi()) redirect("/account/additional-info");
  const branding = await getServerClientBranding();

  return (
    <AppShell
      title="My Assets"
      layout="community"
      clientName={branding.name}
      clientLogo={branding.logo}
    >
      <AssetsBoard />
    </AppShell>
  );
}

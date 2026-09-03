import { AppShell } from "@/components/AppShell";
import { WarrantyList } from "@/components/WarrantyList";
import { getServerClientBranding, requireMenuPath } from "@/lib/server-nav";

export default async function WarrantiesPage() {
  await requireMenuPath("/account/warranties");
  const branding = await getServerClientBranding();

  return (
    <AppShell
      title="ClaimTrack"
      subtitle="Active and past claims"
      backHref="/account"
      clientName={branding.name}
      clientLogo={branding.logo}
    >
      <WarrantyList />
    </AppShell>
  );
}

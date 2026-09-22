import { AmenitiesList } from "@/components/AmenitiesList";
import { AppShell } from "@/components/AppShell";
import { getServerClientBranding, requireMenuPath } from "@/lib/server-nav";

export default async function AmenitiesPage() {
  await requireMenuPath("/account/reservations");
  const branding = await getServerClientBranding();

  return (
    <AppShell
      title="Amenities"
      layout="community"
      clientName={branding.name}
      clientLogo={branding.logo}
    >
      <AmenitiesList />
    </AppShell>
  );
}

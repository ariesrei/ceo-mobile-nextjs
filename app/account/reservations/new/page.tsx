import { AmenityReserve } from "@/components/AmenityReserve";
import { AppShell } from "@/components/AppShell";
import { getServerClientBranding, requireMenuPath } from "@/lib/server-nav";

type Props = {
  searchParams: Promise<{ amenity?: string }>;
};

export default async function ReserveAmenityPage({ searchParams }: Props) {
  await requireMenuPath("/account/reservations");
  const [{ amenity }, branding] = await Promise.all([
    searchParams,
    getServerClientBranding(),
  ]);

  return (
    <AppShell
      title="Reserve"
      layout="community"
      backHref="/account/reservations"
      clientName={branding.name}
      clientLogo={branding.logo}
    >
      <AmenityReserve amenityId={Number(amenity) || 0} />
    </AppShell>
  );
}

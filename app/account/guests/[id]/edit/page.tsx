import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/Card";
import { ClientWpRecord } from "@/components/ClientWpRecord";
import { GuestForm } from "@/components/GuestForm";
import type { GuestItem } from "@/lib/guests";
import { getServerClientBranding, requireMenuPath } from "@/lib/server-nav";
import { wpFetchServer } from "@/lib/wp";

type Props = { params: Promise<{ id: string }> };

export default async function EditGuestPage({ params }: Props) {
  await requireMenuPath("/account/guests");
  const { id } = await params;
  const [result, branding] = await Promise.all([
    wpFetchServer<GuestItem>(`/app/guests/${id}`),
    getServerClientBranding(),
  ]);

  return (
    <AppShell
      title="Edit guest"
      subtitle="Update visit details"
      backHref="/account/guests"
      clientName={branding.name}
      clientLogo={branding.logo}
    >
      <ClientWpRecord<GuestItem>
        path={`/guests/${id}`}
        initial={result.data}
        error={result.error || "Guest not found."}
      >
        {(guest) => (
          <Card>
            <GuestForm guest={guest} />
          </Card>
        )}
      </ClientWpRecord>
    </AppShell>
  );
}

import { AppShell } from "@/components/AppShell";
import { ClientWpRecord } from "@/components/ClientWpRecord";
import { GuestEditView } from "@/components/wp-record-views";
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
      <ClientWpRecord
        path={`/guests/${id}`}
        initial={result.data}
        error={result.error || "Guest not found."}
        as={GuestEditView}
      />
    </AppShell>
  );
}

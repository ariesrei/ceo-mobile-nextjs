import { AppShell } from "@/components/AppShell";
import { ClientWpRecord } from "@/components/ClientWpRecord";
import { AdditionalInfoView } from "@/components/wp-record-views";
import type { AdditionalSections } from "@/lib/additional-info";
import { getServerClientName, requireMenuPath } from "@/lib/server-nav";
import { wpFetchServer } from "@/lib/wp";

export default async function AdditionalInfoPage() {
  await requireMenuPath("/account/additional-info");
  const [result, clientName] = await Promise.all([
    wpFetchServer<{ sections: AdditionalSections }>("/app/additional-info"),
    getServerClientName(),
  ]);

  return (
    <AppShell
      title="Additional Information"
      subtitle="Pets, vehicles, and preferences"
      backHref="/account"
      clientName={clientName}
    >
      <ClientWpRecord
        path="/additional-info"
        initial={result.data}
        error={result.error || "Unavailable."}
        as={AdditionalInfoView}
      />
    </AppShell>
  );
}

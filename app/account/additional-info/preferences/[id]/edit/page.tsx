import { AppShell } from "@/components/AppShell";
import { ClientWpRecord } from "@/components/ClientWpRecord";
import { PreferenceEditView } from "@/components/wp-record-views";
import type { PreferenceItem } from "@/lib/additional-info";
import { getServerClientName, requireMenuPath } from "@/lib/server-nav";
import { wpFetchServer } from "@/lib/wp";

type Props = { params: Promise<{ id: string }> };

export default async function EditPreferencePage({ params }: Props) {
  await requireMenuPath("/account/additional-info");
  const { id } = await params;
  const [result, clientName] = await Promise.all([
    wpFetchServer<PreferenceItem>(`/app/additional-info/preferences/${id}`),
    getServerClientName(),
  ]);

  return (
    <AppShell
      title="Edit preference"
      subtitle="Updates may require staff approval."
      backHref="/account/additional-info"
      clientName={clientName}
    >
      <ClientWpRecord
        path={`/additional-info/preferences/${id}`}
        initial={result.data}
        error={result.error || "Preference not found."}
        as={PreferenceEditView}
      />
    </AppShell>
  );
}

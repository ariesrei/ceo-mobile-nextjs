import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/Card";
import { ClientWpRecord } from "@/components/ClientWpRecord";
import { PreferenceForm } from "@/components/PreferenceForm";
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
      <ClientWpRecord<PreferenceItem>
        path={`/additional-info/preferences/${id}`}
        initial={result.data}
        error={result.error || "Preference not found."}
      >
        {(preference) => (
          <Card>
            <PreferenceForm preference={preference} />
          </Card>
        )}
      </ClientWpRecord>
    </AppShell>
  );
}

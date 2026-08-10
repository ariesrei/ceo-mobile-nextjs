import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/Card";
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
      {!result.data ? (
        <Card>
          <p className="text-sm text-red-700">
            {result.error || "Preference not found."}
          </p>
        </Card>
      ) : (
        <Card>
          <PreferenceForm preference={result.data} />
        </Card>
      )}
    </AppShell>
  );
}

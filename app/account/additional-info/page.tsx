import { AdditionalInfoLists } from "@/components/AdditionalInfoLists";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/Card";
import type { AdditionalSections } from "@/lib/additional-info";
import { getServerClientName, requireMenuPath } from "@/lib/server-nav";
import { wpFetchServer } from "@/lib/wp";

export default async function AdditionalInfoPage() {
  await requireMenuPath("/account/additional-info");
  const [result, clientName] = await Promise.all([
    wpFetchServer<{ sections: AdditionalSections }>("/app/additional-info"),
    getServerClientName(),
  ]);
  const sections = result.data?.sections;

  return (
    <AppShell
      title="Additional Information"
      subtitle="Pets, vehicles, and preferences"
      backHref="/account"
      clientName={clientName}
    >
      {!sections ? (
        <Card>
          <p className="text-sm text-red-700">{result.error || "Unavailable."}</p>
        </Card>
      ) : (
        <AdditionalInfoLists sections={sections} />
      )}
    </AppShell>
  );
}

import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/Card";
import { PreferenceForm } from "@/components/PreferenceForm";
import { getServerClientName, requireMenuPath } from "@/lib/server-nav";

export default async function NewPreferencePage() {
  await requireMenuPath("/account/additional-info");
  const clientName = await getServerClientName();

  return (
    <AppShell
      title="Add preference"
      subtitle="Submitted preferences may require staff approval."
      backHref="/account/additional-info"
      clientName={clientName}
    >
      <Card>
        <PreferenceForm />
      </Card>
    </AppShell>
  );
}

import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/Card";
import { ConnectForm } from "@/components/ConnectForm";

export default function ConnectPage() {
  return (
    <AppShell
      title="Connect"
      subtitle="Enter your property URL and mobile security key."
      showNav={false}
      narrow
    >
      <Card>
        <ConnectForm />
      </Card>
    </AppShell>
  );
}

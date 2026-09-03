import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/Card";
import { LoginForm } from "@/components/LoginForm";
import { getServerClientBranding, requireConnected } from "@/lib/server-nav";

export default async function LoginPage() {
  await requireConnected();
  const branding = await getServerClientBranding();

  return (
    <AppShell
      title="Sign in"
      subtitle="Resident, Building Admin, and Staff access for your property."
      clientName={branding.name}
      clientLogo={branding.logo}
      showNav={false}
      narrow
    >
      <Card>
        <LoginForm />
      </Card>
    </AppShell>
  );
}

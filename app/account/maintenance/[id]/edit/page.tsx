import { AppShell } from "@/components/AppShell";
import { MaintenanceForm } from "@/components/MaintenanceForm";
import { Card } from "@/components/ui/Card";
import type { MaintenanceItem } from "@/lib/maintenance";
import { getServerClientBranding, requireMenuPath } from "@/lib/server-nav";
import { wpFetchServer } from "@/lib/wp";

type Props = { params: Promise<{ id: string }> };

export default async function EditMaintenancePage({ params }: Props) {
  const { id } = await params;
  await requireMenuPath("/account/maintenance");
  const [result, branding] = await Promise.all([
    wpFetchServer<MaintenanceItem>(`/app/maintenance/${id}`),
    getServerClientBranding(),
  ]);

  return (
    <AppShell
      title="Edit maintenance"
      subtitle="Update request details"
      backHref="/account/maintenance"
      clientName={branding.name}
      clientLogo={branding.logo}
    >
      {result.data ? (
        <MaintenanceForm record={result.data} />
      ) : (
        <Card>
          <p className="text-sm text-red-700">
            {result.error || "Maintenance record not found."}
          </p>
        </Card>
      )}
    </AppShell>
  );
}

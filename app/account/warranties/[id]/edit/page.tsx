import { AppShell } from "@/components/AppShell";
import { WarrantyForm } from "@/components/WarrantyForm";
import { Card } from "@/components/ui/Card";
import type { WarrantyItem } from "@/lib/warranties";
import { getServerClientBranding, requireMenuPath } from "@/lib/server-nav";
import { wpFetchServer } from "@/lib/wp";

type Props = { params: Promise<{ id: string }> };

export default async function EditWarrantyPage({ params }: Props) {
  const { id } = await params;
  await requireMenuPath("/account/warranties");
  const [result, branding] = await Promise.all([
    wpFetchServer<WarrantyItem>(`/app/warranties/${id}`),
    getServerClientBranding(),
  ]);

  return (
    <AppShell
      title="Edit ticket"
      subtitle="Update request details"
      backHref="/account/warranties"
      clientName={branding.name}
      clientLogo={branding.logo}
    >
      {result.data ? (
        <WarrantyForm record={result.data} />
      ) : (
        <Card>
          <p className="text-sm text-[var(--danger)]">
            {result.error || "Warranty not found."}
          </p>
        </Card>
      )}
    </AppShell>
  );
}

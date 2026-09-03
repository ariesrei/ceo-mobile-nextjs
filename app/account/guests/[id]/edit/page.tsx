import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/Card";
import { GuestForm } from "@/components/GuestForm";
import type { GuestItem } from "@/lib/guests";
import { getServerClientBranding, requireMenuPath } from "@/lib/server-nav";
import { wpFetchServer } from "@/lib/wp";

type Props = { params: Promise<{ id: string }> };

export default async function EditGuestPage({ params }: Props) {
  await requireMenuPath("/account/guests");
  const { id } = await params;
  const [result, branding] = await Promise.all([
    wpFetchServer<GuestItem>(`/app/guests/${id}`),
    getServerClientBranding(),
  ]);

  return (
    <AppShell
      title="Edit guest"
      subtitle="Update visit details"
      backHref="/account/guests"
      clientName={branding.name}
      clientLogo={branding.logo}
    >
      {!result.data ? (
        <Card>
          <p className="text-sm text-red-700">
            {result.error || "Guest not found."}
          </p>
        </Card>
      ) : (
        <Card>
          <GuestForm guest={result.data} />
        </Card>
      )}
    </AppShell>
  );
}

import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/ui/ListState";
import { showOpsAssetsUi } from "@/lib/app-profile";
import { getServerClientBranding, requireMenuPath } from "@/lib/server-nav";

export async function StaffModulePlaceholder({
  path,
  title,
  subtitle,
  description,
}: {
  path: string;
  title: string;
  subtitle: string;
  description: string;
}) {
  await requireMenuPath(path);
  const branding = await getServerClientBranding();
  const community = showOpsAssetsUi();

  return (
    <AppShell
      title={title}
      subtitle={community ? undefined : subtitle}
      backHref={community ? undefined : "/account"}
      layout={community ? "community" : "default"}
      clientName={branding.name}
      clientLogo={branding.logo}
    >
      <EmptyState icon="inbox" subtitle={description}>
        {`${title} isn't ready yet`}
      </EmptyState>
    </AppShell>
  );
}

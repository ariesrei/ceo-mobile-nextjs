import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/Card";
import { getServerClientBranding, requireMenuPath } from "@/lib/server-nav";

export async function StaffModulePlaceholder({
  path,
  title,
  accessKey,
}: {
  path: string;
  title: string;
  accessKey: string;
}) {
  await requireMenuPath(path);
  const branding = await getServerClientBranding();

  return (
    <AppShell
      title={title}
      subtitle="Staff module"
      backHref="/account"
      clientName={branding.name}
      clientLogo={branding.logo}
    >
      <Card>
        <p className="text-sm text-[var(--muted)]">
          {title} is available for Building Admin and Staff with{" "}
          <code className="rounded bg-[var(--surface-2)] px-1.5 py-0.5 text-xs">
            {accessKey}
          </code>
          . Full workflows will be added in a later phase.
        </p>
      </Card>
    </AppShell>
  );
}

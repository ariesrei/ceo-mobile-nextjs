import { AppShell } from "@/components/AppShell";
import { DocumentsFolder } from "@/components/DocumentsFolder";
import { getServerClientBranding, requireAuth } from "@/lib/server-nav";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function DocumentsFolderPage({ params }: Props) {
  await requireAuth();
  const [{ id }, branding] = await Promise.all([
    params,
    getServerClientBranding(),
  ]);

  return (
    <AppShell
      title="Folder"
      layout="community"
      backHref="/account/documents"
      clientName={branding.name}
      clientLogo={branding.logo}
    >
      <DocumentsFolder folderId={Number(id) || 0} />
    </AppShell>
  );
}

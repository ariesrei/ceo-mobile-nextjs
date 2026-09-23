import { AppShell } from "@/components/AppShell";
import { ClientWpRecord } from "@/components/ClientWpRecord";
import { EditProfileView } from "@/components/wp-record-views";
import { WarrantyShell } from "@/components/WarrantyShell";
import {
  COOKIE_WARRANTY_CHROME,
  keepWarrantyChrome,
  showOpsCommunityUi,
} from "@/lib/app-profile";
import { cookies } from "next/headers";
import {
  getServerAppProfile,
  getServerClientBranding,
  requireAuth,
} from "@/lib/server-nav";
import { wpFetchServer } from "@/lib/wp";
import type { Profile } from "@/lib/types";

type Props = { searchParams?: Promise<{ from?: string }> };

export default async function EditProfilePage({ searchParams }: Props) {
  const profile = await getServerAppProfile();
  const from = (await searchParams)?.from;
  const chromeCookie = (await cookies()).get(COOKIE_WARRANTY_CHROME)?.value;
  const warrantyChrome = keepWarrantyChrome(from, chromeCookie);
  const [result, branding] = await Promise.all([
    wpFetchServer<Profile>("/app/profile"),
    getServerClientBranding(),
  ]);

  if (showOpsCommunityUi(profile) && !warrantyChrome) {
    await requireAuth();
    return (
      <AppShell
        title="Edit Profile"
        layout="community"
        backHref="/account/profile"
        clientName={branding.name}
        clientLogo={branding.logo}
      >
        <ClientWpRecord
          path="/profile"
          initial={result.data}
          error={result.error || "Profile unavailable."}
          as={EditProfileView}
        />
      </AppShell>
    );
  }

  await requireAuth();

  return (
    <WarrantyShell
      title="Edit Profile"
      backHref="/account/profile?from=warranty"
    >
      <ClientWpRecord
        path="/profile"
        initial={result.data}
        error={result.error || "Profile unavailable."}
        as={EditProfileView}
      />
    </WarrantyShell>
  );
}

import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/Card";
import {
  COOKIE_APP_PROFILE,
  COOKIE_SITE_PROFILE,
  getBuildAppProfile,
  normalizeAppProfile,
  productName,
  type AppProfile,
} from "@/lib/app-profile";
import {
  PRIVACY_POLICY_URL,
  SUPPORT_URL,
  TERMS_URL,
  storeLinksForProfile,
} from "@/lib/store-links";
import { cookies } from "next/headers";

function DownloadButtons({ profile }: { profile: AppProfile }) {
  const links = storeLinksForProfile(profile);
  const name = productName(profile);
  return (
    <Card>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
        {name}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
        {profile === "warranty"
          ? "ClaimTrack is not listed in store search. Install only from this page or a link your community office shares."
          : "CE OneSource Operations is not listed in store search. Install only from this page or a link your community office shares."}
      </p>
      <div className="mt-5 flex flex-col gap-3">
        {links.playLive ? (
          <a
            href={links.playUrl}
            className="ceo-btn-accent inline-flex items-center justify-center rounded-xl bg-[var(--accent)] px-4 py-3 text-center text-sm font-semibold text-[#081014]"
          >
            Download on Google Play
          </a>
        ) : (
          <span className="inline-flex items-center justify-center rounded-xl bg-[var(--surface-2)] px-4 py-3 text-center text-sm font-semibold text-[var(--muted)]">
            Google Play — coming soon
          </span>
        )}
        {links.iosLive ? (
          <a
            href={links.iosUrl}
            className="inline-flex items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-center text-sm font-semibold text-[var(--ink)]"
          >
            Download on the App Store
          </a>
        ) : (
          <span className="inline-flex items-center justify-center rounded-xl border border-[var(--border)] px-4 py-3 text-center text-sm font-semibold text-[var(--muted)]">
            App Store — coming soon
          </span>
        )}
      </div>
    </Card>
  );
}

export default async function DownloadPage({
  searchParams,
}: {
  searchParams: Promise<{ app?: string }>;
}) {
  const query = await searchParams;
  const jar = await cookies();
  const requested =
    normalizeAppProfile(query.app) ||
    normalizeAppProfile(jar.get(COOKIE_SITE_PROFILE)?.value) ||
    normalizeAppProfile(jar.get(COOKIE_APP_PROFILE)?.value) ||
    getBuildAppProfile();

  const title = requested ? `Get ${productName(requested)}` : "Get the app";

  return (
    <AppShell
      title={title}
      subtitle="Unlisted store links. You still connect with your property URL and mobile security key."
      showNav={false}
      narrow
    >
      {requested ? (
        <DownloadButtons profile={requested} />
      ) : (
        <div className="space-y-4">
          <DownloadButtons profile="operations" />
          <DownloadButtons profile="warranty" />
        </div>
      )}
      <p className="mt-5 text-xs leading-relaxed text-[var(--muted)]">
        <a
          href={PRIVACY_POLICY_URL}
          className="font-semibold text-[var(--accent)] underline underline-offset-2"
          target="_blank"
          rel="noopener noreferrer"
        >
          Privacy Policy
        </a>
        {" · "}
        <a
          href={TERMS_URL}
          className="font-semibold text-[var(--accent)] underline underline-offset-2"
          target="_blank"
          rel="noopener noreferrer"
        >
          Terms
        </a>
        {" · "}
        <a
          href={SUPPORT_URL}
          className="font-semibold text-[var(--accent)] underline underline-offset-2"
          target="_blank"
          rel="noopener noreferrer"
        >
          Support
        </a>
      </p>
    </AppShell>
  );
}

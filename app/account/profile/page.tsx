import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/Card";
import { ClientWpRecord } from "@/components/ClientWpRecord";
import { getServerClientName, requireMenuPath } from "@/lib/server-nav";
import { wpFetchServer } from "@/lib/wp";
import type { Profile } from "@/lib/types";

function Row({ label, value }: { label: string; value?: string | boolean }) {
  if (value === undefined || value === "") return null;
  const text = typeof value === "boolean" ? (value ? "On" : "Off") : value;
  return (
    <div className="flex justify-between gap-4 border-b border-[var(--border)] py-3.5 last:border-0">
      <dt className="text-sm text-[var(--muted)]">{label}</dt>
      <dd className="text-right text-sm font-semibold text-[var(--ink)]">{text}</dd>
    </div>
  );
}

function ProfileBody({ profile }: { profile: Profile }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center pt-2 text-center">
        <div className="relative">
          {profile.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatar}
              alt=""
              className="h-24 w-24 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[var(--surface)] text-2xl font-bold text-[var(--accent)]">
              {(profile.first_name || "?").slice(0, 1)}
            </div>
          )}
          <Link
            href="/account/edit"
            className="absolute -bottom-1 -right-1 rounded-full bg-[var(--accent)] px-2.5 py-1 text-[10px] font-extrabold text-[#081014]"
          >
            Edit
          </Link>
        </div>
        <p className="mt-4 text-xl font-bold">{profile.full_name}</p>
        <p className="text-sm text-[var(--muted)]">
          {[profile.contact_type, profile.membership_type, profile.contact_status]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>

      <div className="ceo-profile-grid">
        <Card>
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
            Contact information
          </p>
          <dl>
            <Row label="Email" value={profile.ceo_email || profile.email} />
            <Row label="Phone" value={profile.phone} />
            <Row label="Mobile" value={profile.mobile} />
          </dl>
        </Card>

        <Card>
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
            Details
          </p>
          <dl>
            <Row label="Company" value={profile.company} />
            <Row label="Job title" value={profile.job_title} />
            <Row label="Birthday" value={profile.birthday} />
            <Row label="Emergency" value={profile.emergency_contact} />
            <Row label="Email alerts" value={profile.opt_email} />
            <Row label="SMS alerts" value={profile.opt_sms} />
          </dl>
        </Card>
      </div>
    </div>
  );
}

export default async function ProfilePage() {
  await requireMenuPath("/account/profile");
  const [result, clientName] = await Promise.all([
    wpFetchServer<Profile>("/app/profile"),
    getServerClientName(),
  ]);

  return (
    <AppShell title="My Profile" backHref="/account" clientName={clientName}>
      <ClientWpRecord<Profile>
        path="/profile"
        initial={result.data}
        error={result.error}
      >
        {(profile) => <ProfileBody profile={profile} />}
      </ClientWpRecord>
    </AppShell>
  );
}

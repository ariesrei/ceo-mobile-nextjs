import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/Card";
import { getServerClientName, requireMenuPath } from "@/lib/server-nav";
import { wpFetchServer } from "@/lib/wp";
import type { Profile } from "@/lib/types";

function Row({ label, value }: { label: string; value?: string | boolean }) {
  if (value === undefined || value === "") return null;
  const text = typeof value === "boolean" ? (value ? "Yes" : "No") : value;
  return (
    <div className="flex justify-between gap-4 border-b border-[var(--border)] py-3 last:border-0">
      <dt className="text-sm text-[var(--muted)]">{label}</dt>
      <dd className="text-right text-sm font-medium text-[var(--ink)]">{text}</dd>
    </div>
  );
}

export default async function ProfilePage() {
  await requireMenuPath("/account/profile");
  const [result, clientName] = await Promise.all([
    wpFetchServer<Profile>("/app/profile"),
    getServerClientName(),
  ]);
  const profile = result.data;

  return (
    <AppShell title="My Profile" backHref="/account" clientName={clientName}>
      {!profile ? (
        <Card>
          <p className="text-sm text-red-700">{result.error || "Profile unavailable."}</p>
        </Card>
      ) : (
        <Card>
          <div className="mb-4 flex items-center gap-3">
            {profile.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar}
                alt=""
                className="h-14 w-14 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--surface-2)] text-lg font-semibold text-[var(--accent)]">
                {(profile.first_name || "?").slice(0, 1)}
              </div>
            )}
            <div>
              <p className="font-display text-xl">{profile.full_name}</p>
              <p className="text-sm text-[var(--muted)]">{profile.contact_status}</p>
            </div>
          </div>
          <dl>
            <Row label="Email" value={profile.ceo_email || profile.email} />
            <Row label="Phone" value={profile.phone} />
            <Row label="Mobile" value={profile.mobile} />
            <Row label="Company" value={profile.company} />
            <Row label="Job title" value={profile.job_title} />
            <Row label="Birthday" value={profile.birthday} />
            <Row label="Membership" value={profile.membership_type} />
            <Row label="Allergies" value={profile.allergies} />
            <Row label="Emergency" value={profile.emergency_contact} />
            <Row label="Email opt-in" value={profile.opt_email} />
            <Row label="SMS opt-in" value={profile.opt_sms} />
          </dl>
        </Card>
      )}
    </AppShell>
  );
}

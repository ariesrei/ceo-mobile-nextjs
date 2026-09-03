"use client";

import { FormEvent, useState } from "react";
import type { Profile } from "@/lib/types";
import { Button } from "./ui/Button";
import { DateField } from "./ui/DateField";
import { Input } from "./ui/Input";
import { ProfileAvatarField } from "./ProfileAvatarField";

export function EditProfileForm({ profile }: { profile: Profile }) {
  const [form, setForm] = useState({
    first_name: profile.first_name || "",
    last_name: profile.last_name || "",
    email: profile.ceo_email || profile.email || "",
    phone: profile.phone || "",
    mobile: profile.mobile || "",
    company: profile.company || "",
    job_title: profile.job_title || "",
    website: profile.website || "",
    allergies: profile.allergies || "",
    emergency_contact: profile.emergency_contact || "",
    birthday: profile.birthday || "",
    opt_email: profile.opt_email,
    opt_sms: profile.opt_sms,
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingAvatar, setPendingAvatar] = useState<{
    id: number;
    url: string;
  } | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/wp/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          ...(pendingAvatar
            ? {
                custom_avatar_id: pendingAvatar.id,
                custom_avatar: pendingAvatar.url,
              }
            : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Could not save profile.");
        return;
      }
      setMessage(data.message || "Saved.");
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }

  const initials = (
    form.first_name ||
    profile.first_name ||
    "?"
  ).slice(0, 1);

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <ProfileAvatarField
        avatar={profile.avatar}
        initials={initials}
        onPendingChange={setPendingAvatar}
      />
      <div className="ceo-form-row">
        <Input
          label="First name"
          value={form.first_name}
          onChange={(e) => setForm({ ...form, first_name: e.target.value })}
        />
        <Input
          label="Last name"
          value={form.last_name}
          onChange={(e) => setForm({ ...form, last_name: e.target.value })}
        />
      </div>
      <div className="ceo-form-row">
        <Input
          label="Email"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <Input
          label="Phone"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <Input
          label="Mobile Number for SMS Notifications"
          value={form.mobile}
          onChange={(e) => setForm({ ...form, mobile: e.target.value })}
          placeholder="+1XXXXXXXXXX"
        />
        <p className="text-xs text-[var(--muted)]">
          Primary number for SMS. Use country code when possible (e.g. +1…).
        </p>
      </div>
      <div className="ceo-form-row">
        <Input
          label="Company"
          value={form.company}
          onChange={(e) => setForm({ ...form, company: e.target.value })}
        />
        <Input
          label="Job title"
          value={form.job_title}
          onChange={(e) => setForm({ ...form, job_title: e.target.value })}
        />
      </div>
      <DateField
        label="Birthday"
        value={form.birthday}
        onChange={(birthday) => setForm({ ...form, birthday })}
        toDate={new Date()}
      />
      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-[var(--muted)]">
          Emergency contact
        </span>
        <textarea
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3.5 py-3 text-[var(--ink)] outline-none ring-[var(--accent)] focus:ring-2"
          rows={3}
          value={form.emergency_contact}
          onChange={(e) =>
            setForm({ ...form, emergency_contact: e.target.value })
          }
        />
      </label>
      <button
        type="button"
        className="flex w-full items-center justify-between rounded-xl bg-[var(--surface-2)] px-4 py-3 text-sm font-semibold"
        onClick={() => setForm({ ...form, opt_email: !form.opt_email })}
      >
        Email notifications
        <span className={`ceo-toggle ${form.opt_email ? "is-on" : ""}`} aria-hidden>
          <span />
        </span>
      </button>
      <div className="space-y-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
        <button
          type="button"
          className="flex w-full items-center justify-between text-left text-sm font-semibold"
          onClick={() => setForm({ ...form, opt_sms: !form.opt_sms })}
        >
          SMS notifications
          <span className={`ceo-toggle ${form.opt_sms ? "is-on" : ""}`} aria-hidden>
            <span />
          </span>
        </button>
        <p className="text-xs leading-relaxed text-[var(--muted)]">
          I agree to receive SMS text messages from CE OneSource regarding
          warranty requests, work order updates, amenity bookings, package and
          parcel notifications, building operations and emergency alerts, and
          account notifications for my property. Message frequency varies based
          on building activity, typically 2–10 messages per month. Message and
          data rates may apply. Reply STOP at any time to unsubscribe or HELP
          for assistance. Consent is not a condition of purchase or use of
          services. By enabling SMS notifications, you also agree to our{" "}
          <a
            href="https://www.ceonesource.com/privacy-policy/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-[var(--accent)] underline underline-offset-2"
          >
            Privacy Policy
          </a>{" "}
          and{" "}
          <a
            href="https://www.ceonesource.com/terms-and-conditions/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-[var(--accent)] underline underline-offset-2"
          >
            SMS Terms and Conditions
          </a>
          .
        </p>
      </div>
      {error ? (
        <p className="rounded-xl bg-[#3a1c1c] px-3 py-2 text-sm text-[var(--danger)]">{error}</p>
      ) : null}
      {message ? (
        <p className="rounded-xl bg-[#163a28] px-3 py-2 text-sm text-[var(--ok)]">
          {message}
        </p>
      ) : null}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Submitting…" : "Submit for review"}
      </Button>
    </form>
  );
}

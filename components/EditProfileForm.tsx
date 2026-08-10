"use client";

import { FormEvent, useState } from "react";
import type { Profile } from "@/lib/types";
import { Button } from "./ui/Button";
import { DateField } from "./ui/DateField";
import { Input } from "./ui/Input";

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

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/wp/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
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

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
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
          className="w-full rounded-xl border border-[var(--border)] bg-white px-3.5 py-3 text-[var(--ink)] outline-none ring-[var(--accent)] focus:ring-2"
          rows={3}
          value={form.emergency_contact}
          onChange={(e) =>
            setForm({ ...form, emergency_contact: e.target.value })
          }
        />
      </label>
      <label className="flex items-center gap-2 text-sm text-[var(--ink)]">
        <input
          type="checkbox"
          checked={form.opt_email}
          onChange={(e) => setForm({ ...form, opt_email: e.target.checked })}
        />
        Receive Email Notifications
      </label>
      <div className="space-y-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
        <label className="flex items-start gap-2 text-sm font-medium text-[var(--ink)]">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={form.opt_sms}
            onChange={(e) => setForm({ ...form, opt_sms: e.target.checked })}
          />
          Receive SMS Notifications
        </label>
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
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}
      {message ? (
        <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {message}
        </p>
      ) : null}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Submitting…" : "Submit for review"}
      </Button>
    </form>
  );
}

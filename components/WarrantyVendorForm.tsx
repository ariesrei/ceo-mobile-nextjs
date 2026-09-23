"use client";

import { FormEvent, useState } from "react";
import type { WarrantyVendor } from "@/lib/warranties";
import { saveWarrantyVendor } from "@/lib/helpers/warranties";
import { ProfileAvatarField } from "./ProfileAvatarField";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";

function initialsFor(vendor: WarrantyVendor) {
  return (vendor.company || vendor.label || "?").slice(0, 1).toUpperCase();
}

export function WarrantyVendorForm({
  vendor,
  onSaved,
}: {
  vendor: WarrantyVendor;
  onSaved: (next: WarrantyVendor) => void;
}) {
  const [form, setForm] = useState({
    company: vendor.company || vendor.label || "",
    salutation: vendor.salutation || "",
    first_name: vendor.first_name || "",
    last_name: vendor.last_name || "",
    email: vendor.email || "",
    phone: vendor.phone || vendor.company_phone || "",
    mobile: vendor.mobile || "",
    job_title: vendor.job_title || "",
    opt_email: Boolean(vendor.opt_email),
    opt_sms: Boolean(vendor.opt_sms),
  });
  const [avatar, setAvatar] = useState(vendor.avatar || "");
  const [pendingAvatar, setPendingAvatar] = useState<{
    id: number;
    url: string;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  function setField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    const result = await saveWarrantyVendor(vendor.id, {
      ...form,
      ...(pendingAvatar
        ? {
            custom_avatar_id: pendingAvatar.id,
            custom_avatar: pendingAvatar.url,
          }
        : {}),
    });
    setSaving(false);
    if (!result.ok) {
      setError(result.message || "Could not save company.");
      return;
    }
    const next = {
      ...vendor,
      ...form,
      avatar: pendingAvatar?.url || avatar,
    };
    setAvatar(next.avatar || "");
    setMessage(result.message || "Company saved.");
    onSaved(next);
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <ProfileAvatarField
        avatar={avatar}
        initials={initialsFor(vendor)}
        uploadUrl="/api/wp/profile/media"
        title="Company photo"
        subtitle="Photo is submitted with Save company."
        onPendingChange={(pending) => {
          setPendingAvatar(pending);
          if (pending?.url) setAvatar(pending.url);
        }}
      />

      <Input
        label="Company"
        name="company"
        required
        value={form.company}
        onChange={(e) => setField("company", e.target.value)}
      />
      <Input
        label="Salutation"
        name="salutation"
        value={form.salutation}
        onChange={(e) => setField("salutation", e.target.value)}
      />
      <Input
        label="First name"
        name="first_name"
        value={form.first_name}
        onChange={(e) => setField("first_name", e.target.value)}
      />
      <Input
        label="Last name"
        name="last_name"
        value={form.last_name}
        onChange={(e) => setField("last_name", e.target.value)}
      />
      <Input
        label="Email"
        name="email"
        type="email"
        value={form.email}
        onChange={(e) => setField("email", e.target.value)}
      />
      <Input
        label="Phone"
        name="phone"
        type="tel"
        value={form.phone}
        onChange={(e) => setField("phone", e.target.value)}
      />
      <Input
        label="Mobile"
        name="mobile"
        type="tel"
        value={form.mobile}
        onChange={(e) => setField("mobile", e.target.value)}
      />
      <Input
        label="Job title"
        name="job_title"
        value={form.job_title}
        onChange={(e) => setField("job_title", e.target.value)}
      />

      <label className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-3 text-sm">
        <input
          type="checkbox"
          checked={form.opt_email}
          onChange={(e) => setField("opt_email", e.target.checked)}
        />
        Email notification
      </label>
      <label className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-3 text-sm">
        <input
          type="checkbox"
          checked={form.opt_sms}
          onChange={(e) => setField("opt_sms", e.target.checked)}
        />
        SMS notification
      </label>

      {error ? (
        <p className="rounded-xl bg-[#3a1c1c] px-3 py-2 text-sm text-[var(--danger)]">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="rounded-xl bg-[#163a28] px-3 py-2 text-sm text-[var(--ok)]">
          {message}
        </p>
      ) : null}

      <Button type="submit" disabled={saving} className="w-full">
        {saving ? "Saving…" : "Save company"}
      </Button>
    </form>
  );
}

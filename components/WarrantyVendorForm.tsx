"use client";

import { FormEvent, useState } from "react";
import type { WarrantyVendor } from "@/lib/warranties";
import { saveWarrantyVendor } from "@/lib/helpers/warranties";
import { ProfileAvatarField } from "./ProfileAvatarField";
import { Button } from "./ui/Button";
import { FieldLabel } from "./ui/FieldLabel";
import { Input } from "./ui/Input";

function initialsFor(vendor: WarrantyVendor) {
  return (vendor.company || vendor.label || "?").slice(0, 1).toUpperCase();
}

function toDateInput(value: string) {
  const ymd = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymd) return ymd[0];
  const mdy = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!mdy) return value;
  return `${mdy[3]}-${mdy[1].padStart(2, "0")}-${mdy[2].padStart(2, "0")}`;
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
    address: vendor.address || "",
    company_phone: vendor.company_phone || "",
    phone: vendor.phone || "",
    mobile: vendor.mobile || "",
    email: vendor.email || "",
    first_name: vendor.first_name || "",
    last_name: vendor.last_name || "",
    salutation: vendor.salutation || "",
    job_title: vendor.job_title || "",
    coi_expiration: toDateInput(vendor.coi_expiration || ""),
    payment_terms: vendor.payment_terms || "",
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
        userId={vendor.id}
        uploadUrl={`/api/wp/profile/media?user_id=${encodeURIComponent(String(vendor.id))}`}
        title="Company photo"
        subtitle="Photo saves when you upload, or with Save company."
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
      <label className="block space-y-1.5">
        <FieldLabel label="Address" />
        <textarea
          name="address"
          rows={3}
          value={form.address}
          onChange={(e) => setField("address", e.target.value)}
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3.5 py-3 text-[var(--ink)] outline-none ring-[var(--accent)] focus:ring-2"
        />
      </label>
      <Input
        label="Company phone"
        name="company_phone"
        type="tel"
        value={form.company_phone}
        onChange={(e) => setField("company_phone", e.target.value)}
      />
      <Input
        label="COI expiration"
        name="coi_expiration"
        type="date"
        value={form.coi_expiration}
        onChange={(e) => setField("coi_expiration", e.target.value)}
      />
      <label className="block space-y-1.5">
        <FieldLabel label="Payment terms" />
        <textarea
          name="payment_terms"
          rows={3}
          value={form.payment_terms}
          onChange={(e) => setField("payment_terms", e.target.value)}
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3.5 py-3 text-[var(--ink)] outline-none ring-[var(--accent)] focus:ring-2"
        />
      </label>
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

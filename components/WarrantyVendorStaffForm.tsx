"use client";

import { FormEvent, useState } from "react";
import type { WarrantyVendorStaff } from "@/lib/warranties";
import { saveWarrantyVendorStaff } from "@/lib/helpers/warranties";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";

export function WarrantyVendorStaffForm({
  vendorId,
  person,
  onSaved,
}: {
  vendorId: number | string;
  person?: WarrantyVendorStaff;
  onSaved: (next: WarrantyVendorStaff) => void;
}) {
  const [form, setForm] = useState({
    name: person?.name || "",
    job_title: person?.job_title || "",
    email: person?.email || "",
    phone: person?.phone || "",
    active: person?.active !== false,
    notify: Boolean(person?.notify),
    is_primary: Boolean(person?.is_primary),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function setField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form.name.trim()) {
      setError("Staff name is required.");
      return;
    }
    setSaving(true);
    setError("");
    const result = await saveWarrantyVendorStaff(vendorId, {
      id: person?.id,
      ...form,
    });
    setSaving(false);
    if (!result.ok) {
      setError(result.message || "Could not save staff.");
      return;
    }
    onSaved(result.staff || { ...form, id: person?.id });
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <Input
        label="Name"
        name="name"
        required
        value={form.name}
        onChange={(e) => setField("name", e.target.value)}
      />
      <Input
        label="Job title"
        name="job_title"
        value={form.job_title}
        onChange={(e) => setField("job_title", e.target.value)}
      />
      <Input
        label="Email"
        name="email"
        type="email"
        value={form.email}
        onChange={(e) => setField("email", e.target.value)}
      />
      <Input
        label="Phone number"
        name="phone"
        type="tel"
        value={form.phone}
        onChange={(e) => setField("phone", e.target.value)}
      />
      <label className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-3 text-sm">
        <input
          type="checkbox"
          checked={form.active}
          onChange={(e) => setField("active", e.target.checked)}
        />
        Active
      </label>
      <label className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-3 text-sm">
        <input
          type="checkbox"
          checked={form.notify}
          onChange={(e) => setField("notify", e.target.checked)}
        />
        Receive notification
      </label>
      <label className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-3 text-sm">
        <input
          type="checkbox"
          checked={form.is_primary}
          onChange={(e) => setField("is_primary", e.target.checked)}
        />
        Primary executive
      </label>

      {error ? (
        <p className="rounded-xl bg-[#3a1c1c] px-3 py-2 text-sm text-[var(--danger)]">
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={saving} className="w-full">
        {saving ? "Saving…" : person ? "Save staff" : "Add staff"}
      </Button>
    </form>
  );
}

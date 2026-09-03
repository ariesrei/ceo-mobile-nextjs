"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  WarrantyChoice,
  WarrantyItem,
  WarrantyOptions,
  WarrantyPhoto,
} from "@/lib/warranties";
import { CameraCapturePhotos } from "./CameraCapturePhotos";
import { Button } from "./ui/Button";
import { DateField } from "./ui/DateField";
import { Input } from "./ui/Input";
import { Select } from "./ui/Select";
import { StatusBadge } from "./ui/StatusBadge";

function toSelectOptions(items: WarrantyChoice[]) {
  return items.map((i) => ({ id: i.id, label: i.label }));
}

export function WarrantyForm({
  record,
}: {
  record?: WarrantyItem | null;
}) {
  const router = useRouter();
  const isEdit = Boolean(record?.id);
  const [types, setTypes] = useState<WarrantyChoice[]>([]);
  const [units, setUnits] = useState<WarrantyChoice[]>([]);
  const [isStaff, setIsStaff] = useState(false);
  const [statusLabel, setStatusLabel] = useState(
    record?.status_label || "New Warranty Approved"
  );
  const [photos, setPhotos] = useState<WarrantyPhoto[]>(record?.photos || []);
  const [form, setForm] = useState({
    warranty_type: record?.warranty_type || "",
    warranty_unit: record?.warranty_unit ? String(record.warranty_unit) : "",
    warranty_first_name: record?.warranty_first_name || "",
    warranty_last_name: record?.warranty_last_name || "",
    warranty_email_address: record?.warranty_email_address || "",
    warranty_tel_number: record?.warranty_tel_number || "",
    warranty_describe_the_request:
      record?.warranty_describe_the_request ||
      record?.warranty_describe_the_request_single ||
      "",
    warranty_entry_date: record?.warranty_entry_date || "",
    warranty_entry_start_time: record?.warranty_entry_start_time || "",
    warranty_entry_end_time: record?.warranty_entry_end_time || "",
    warranty_entry_notes: record?.warranty_entry_notes || "",
  });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = form.warranty_type
      ? `?warranty_type=${encodeURIComponent(form.warranty_type)}`
      : "";
    fetch(`/api/wp/warranties/options${q}`)
      .then((r) => r.json())
      .then((data: WarrantyOptions) => {
        setTypes(data.types || []);
        setUnits(data.units || []);
        setIsStaff(Boolean(data.is_staff));
        if (!record?.status_label && data.default_status_id) {
          const match = (data.statuses || []).find(
            (s) => String(s.id) === String(data.default_status_id)
          );
          if (match?.label) setStatusLabel(match.label);
        }
        setForm((f) => {
          const next = { ...f };
          if (!next.warranty_type && data.types?.[0]) {
            next.warranty_type = String(data.types[0].id);
          }
          if (!isEdit && !data.is_staff) {
            if (!next.warranty_first_name && data.profile?.first_name) {
              next.warranty_first_name = data.profile.first_name;
            }
            if (!next.warranty_last_name && data.profile?.last_name) {
              next.warranty_last_name = data.profile.last_name;
            }
            if (!next.warranty_email_address && data.profile?.email) {
              next.warranty_email_address = data.profile.email;
            }
            if (!next.warranty_tel_number && data.profile?.phone) {
              next.warranty_tel_number = data.profile.phone;
            }
          }
          return next;
        });
      })
      .catch(() => undefined);
  }, [form.warranty_type, isEdit]);

  useEffect(() => {
    if (isEdit || !isStaff) return;
    if (!form.warranty_unit) {
      setForm((f) => ({
        ...f,
        warranty_first_name: "",
        warranty_last_name: "",
        warranty_email_address: "",
        warranty_tel_number: "",
      }));
      return;
    }
    let cancelled = false;
    fetch(
      `/api/wp/warranties/options?unit_id=${encodeURIComponent(form.warranty_unit)}`
    )
      .then((r) => r.json())
      .then((data: WarrantyOptions) => {
        if (cancelled) return;
        const c = data.unit_contact;
        setForm((f) => ({
          ...f,
          warranty_first_name: c?.first_name || "",
          warranty_last_name: c?.last_name || "",
          warranty_email_address: c?.email || "",
          warranty_tel_number: c?.phone || "",
        }));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [form.warranty_unit, isEdit, isStaff]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const url = isEdit
        ? `/api/wp/warranties/${record!.id}`
        : "/api/wp/warranties";
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          warranty_type: form.warranty_type,
          warranty_unit: Number(form.warranty_unit) || 0,
          warranty_first_name: form.warranty_first_name,
          warranty_last_name: form.warranty_last_name,
          warranty_email_address: form.warranty_email_address,
          warranty_tel_number: form.warranty_tel_number,
          warranty_describe_the_request: form.warranty_describe_the_request,
          warranty_describe_the_request_single:
            form.warranty_describe_the_request,
          warranty_entry_date: form.warranty_entry_date,
          warranty_entry_start_time: form.warranty_entry_start_time,
          warranty_entry_end_time: form.warranty_entry_end_time,
          warranty_entry_notes: form.warranty_entry_notes,
          warranty_photo: photos.map((p) => p.id),
        }),
      });
      const data = (await res.json()) as { message?: string };
      if (!res.ok) {
        setError(data.message || "Could not save warranty.");
        return;
      }
      setMessage(data.message || "Saved.");
      router.push("/account/warranties");
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="ceo-form-row">
        <Select
          label="Type"
          name="warranty_type"
          required
          value={form.warranty_type}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              warranty_type: e.target.value,
              warranty_unit: "",
              warranty_first_name: "",
              warranty_last_name: "",
              warranty_email_address: "",
              warranty_tel_number: "",
            }))
          }
          options={toSelectOptions(types)}
        />
        <Select
          label="Unit"
          name="warranty_unit"
          required
          value={form.warranty_unit}
          onChange={(e) =>
            setForm((f) => ({ ...f, warranty_unit: e.target.value }))
          }
          options={toSelectOptions(units)}
        />
      </div>
      {isStaff ? (
        <div className="space-y-1.5">
          <span className="text-sm font-medium text-[var(--muted)]">Status</span>
          <div>
            <StatusBadge label={statusLabel} />
          </div>
        </div>
      ) : null}
      <div className="ceo-form-row">
        <Input
          label="First name"
          name="warranty_first_name"
          required
          value={form.warranty_first_name}
          onChange={(e) =>
            setForm((f) => ({ ...f, warranty_first_name: e.target.value }))
          }
        />
        <Input
          label="Last name"
          name="warranty_last_name"
          required
          value={form.warranty_last_name}
          onChange={(e) =>
            setForm((f) => ({ ...f, warranty_last_name: e.target.value }))
          }
        />
      </div>
      <div className="ceo-form-row">
        <Input
          label="Email"
          name="warranty_email_address"
          type="email"
          required
          value={form.warranty_email_address}
          onChange={(e) =>
            setForm((f) => ({ ...f, warranty_email_address: e.target.value }))
          }
        />
        <Input
          label="Telephone"
          name="warranty_tel_number"
          required
          value={form.warranty_tel_number}
          onChange={(e) =>
            setForm((f) => ({ ...f, warranty_tel_number: e.target.value }))
          }
        />
      </div>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-[var(--muted)]">
          Describe your request
        </span>
        <textarea
          name="warranty_describe_the_request"
          required
          rows={4}
          value={form.warranty_describe_the_request}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              warranty_describe_the_request: e.target.value,
            }))
          }
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3.5 py-3 text-[var(--ink)] outline-none ring-[var(--accent)] focus:ring-2"
        />
      </label>
      <DateField
        label="Entry date"
        name="warranty_entry_date"
        value={form.warranty_entry_date}
        onChange={(value) =>
          setForm((f) => ({ ...f, warranty_entry_date: value }))
        }
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Start time"
          name="warranty_entry_start_time"
          placeholder="9:00 am"
          value={form.warranty_entry_start_time}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              warranty_entry_start_time: e.target.value,
            }))
          }
        />
        <Input
          label="End time"
          name="warranty_entry_end_time"
          placeholder="5:00 pm"
          value={form.warranty_entry_end_time}
          onChange={(e) =>
            setForm((f) => ({ ...f, warranty_entry_end_time: e.target.value }))
          }
        />
      </div>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-[var(--muted)]">
          Entry notes
        </span>
        <textarea
          name="warranty_entry_notes"
          rows={2}
          value={form.warranty_entry_notes}
          onChange={(e) =>
            setForm((f) => ({ ...f, warranty_entry_notes: e.target.value }))
          }
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3.5 py-3 text-[var(--ink)] outline-none ring-[var(--accent)] focus:ring-2"
        />
      </label>
      <CameraCapturePhotos
        photos={photos}
        onChange={setPhotos}
        uploadUrl="/api/wp/warranties/media"
        parentIdKey="warranty_id"
        parentId={record?.id}
        disabled={loading}
      />
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
      <Button type="submit" disabled={loading} className="w-full">
        {loading
          ? "Saving…"
          : isEdit
            ? "Save ticket"
            : isStaff
              ? "Create ticket"
              : "Submit warranty"}
      </Button>
    </form>
  );
}

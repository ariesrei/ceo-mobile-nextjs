"use client";

import { FormEvent, ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  WarrantyChoice,
  WarrantyItem,
  WarrantyOptions,
  WarrantyPhoto,
} from "@/lib/warranties";
import { CameraCapturePhotos } from "./CameraCapturePhotos";
import { FastLink } from "./FastLink";
import { Button } from "./ui/Button";
import { DateField } from "./ui/DateField";
import { Input } from "./ui/Input";
import { Select } from "./ui/Select";
import { ChevronRightIcon } from "./ui/Icons";

function toSelectOptions(items: WarrantyChoice[]) {
  return items.map((i) => ({ id: i.id, label: i.label }));
}

export function WarrantyForm({
  record,
  /** Edit screen: the same fields grouped into collapsible sections. */
  sectioned = false,
}: {
  record?: WarrantyItem | null;
  sectioned?: boolean;
}) {
  const router = useRouter();
  const isEdit = Boolean(record?.id);
  const [types, setTypes] = useState<WarrantyChoice[]>([]);
  const [units, setUnits] = useState<WarrantyChoice[]>([]);
  const [locations, setLocations] = useState<WarrantyChoice[]>([]);
  const [isStaff, setIsStaff] = useState(false);
  const [statusLabel, setStatusLabel] = useState(
    record?.status_label || ""
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
    warranty_location: (
      record?.warranty_location ||
      record?.warranty_location_single ||
      []
    ).map(String),
    warranty_entry_date: record?.warranty_entry_date || "",
    warranty_entry_start_time: record?.warranty_entry_start_time || "",
    warranty_entry_end_time: record?.warranty_entry_end_time || "",
    warranty_entry_notes: record?.warranty_entry_notes || "",
  });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [notice, setNotice] = useState("");
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
        setLocations(data.locations || []);
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
  }, [form.warranty_type, isEdit, record?.status_label]);

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
          warranty_location: form.warranty_location
            .map((id) => Number(id))
            .filter((id) => id > 0),
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

  const claimInformation = (
    <>
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
      {isStaff && !sectioned && statusLabel ? (
        <div className="space-y-1.5">
          <span className="text-sm font-medium text-[var(--muted)]">Status</span>
          <p className="ceo-field-box">{statusLabel}</p>
        </div>
      ) : null}
    </>
  );

  const contactInformation = (
    <>
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
    </>
  );

  const description = (
    <>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-[var(--muted)]">
          Locations
        </span>
        <div className="max-h-48 space-y-2 overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3.5 py-3">
          {locations.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No locations available.</p>
          ) : (
            locations.map((loc) => {
              const id = String(loc.id);
              const checked = form.warranty_location.includes(id);
              return (
                <label
                  key={id}
                  className="flex items-center gap-2 text-sm text-[var(--ink)]"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      setForm((f) => ({
                        ...f,
                        warranty_location: e.target.checked
                          ? [...f.warranty_location, id]
                          : f.warranty_location.filter((x) => x !== id),
                      }));
                    }}
                  />
                  {loc.label}
                </label>
              );
            })
          )}
        </div>
      </label>
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
      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-[var(--muted)]">Entry notes</span>
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
    </>
  );

  const datesAndTimes = (
    <>
      <DateField
        label="Entry date"
        name="warranty_entry_date"
        value={form.warranty_entry_date}
        onChange={(value) => setForm((f) => ({ ...f, warranty_entry_date: value }))}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Start time"
          name="warranty_entry_start_time"
          placeholder="9:00 am"
          value={form.warranty_entry_start_time}
          onChange={(e) =>
            setForm((f) => ({ ...f, warranty_entry_start_time: e.target.value }))
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
    </>
  );

  const attachments = (
    <CameraCapturePhotos
      variant="tiles"
      label="Photos / Documents"
      photos={photos}
      onChange={setPhotos}
      uploadUrl="/api/wp/warranties/media"
      parentIdKey="warranty_id"
      parentId={record?.id}
      disabled={loading}
    />
  );

  const feedback = (
    <>
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
    </>
  );

  const submitLabel = loading
    ? "Saving…"
    : isEdit
      ? "Save Claim"
      : isStaff
        ? "Create Claim"
        : "Submit Warranty";

  if (sectioned) {
    return (
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="ceo-accordion">
          <Section title="Claim Information">
            {claimInformation}
          </Section>
          <Section title="Contact Information">{contactInformation}</Section>
          <Section title="Description & Notes">{description}</Section>
          <Section title="Dates & Times">{datesAndTimes}</Section>
          <Section
            title="Photos & Documents"
            meta={photos.length ? `${photos.length} attached` : undefined}
          >
            {attachments}
          </Section>

          {record?.id ? (
            <FastLink
              href={`/account/warranties/${record.id}/status`}
              className="ceo-accordion__row"
            >
              <span className="ceo-accordion__title">Status</span>
              <span className="ceo-accordion__meta">
                {record.status_label || statusLabel || "—"}
              </span>
              <ChevronRightIcon className="ceo-accordion__chev" />
            </FastLink>
          ) : (
            <div className="ceo-accordion__row">
              <span className="ceo-accordion__title">Status</span>
              <span className="ceo-accordion__meta">{statusLabel || "—"}</span>
            </div>
          )}

          {record?.id ? (
            <FastLink
              href={`/account/warranties/${record.id}/assign`}
              className="ceo-accordion__row"
            >
              <span className="ceo-accordion__title">Assigned Subcontractor</span>
              <span className="ceo-accordion__meta">
                {record.subcontractor_name || "Unassigned"}
              </span>
              <ChevronRightIcon className="ceo-accordion__chev" />
            </FastLink>
          ) : (
            <div className="ceo-accordion__row">
              <span className="ceo-accordion__title">Assigned Subcontractor</span>
              <span className="ceo-accordion__meta">Unassigned</span>
            </div>
          )}

          <Section title="Internal Notes">
            <p className="text-sm text-[var(--muted)]">
              {record?.warranty_sources_internal_note ||
                "No internal notes yet. Notes are added when a claim is assigned."}
            </p>
          </Section>
        </div>

        {feedback}

        <Button type="submit" disabled={loading} className="w-full">
          {submitLabel}
        </Button>

        <button
          type="button"
          className="ceo-btn-danger-outline w-full"
          onClick={() =>
            setNotice("Archiving connects to WordPress in a later pass.")
          }
        >
          Archive Claim
        </button>
        {notice ? (
          <p className="text-center text-xs text-[var(--muted)]">{notice}</p>
        ) : null}
      </form>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {claimInformation}
      <p className="ceo-section-label pt-1">Contact Information</p>
      {contactInformation}
      {description}
      {datesAndTimes}
      {attachments}
      {feedback}
      <Button type="submit" disabled={loading} className="w-full">
        {submitLabel}
      </Button>
    </form>
  );
}

function Section({
  title,
  meta,
  defaultOpen = false,
  children,
}: {
  title: string;
  meta?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  return (
    <details className="ceo-accordion__item" open={defaultOpen}>
      <summary className="ceo-accordion__row">
        <span className="ceo-accordion__title">{title}</span>
        {meta ? <span className="ceo-accordion__meta">{meta}</span> : null}
        <ChevronRightIcon className="ceo-accordion__chev" />
      </summary>
      <div className="ceo-accordion__body">{children}</div>
    </details>
  );
}

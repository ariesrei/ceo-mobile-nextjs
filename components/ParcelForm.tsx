"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  ParcelChoice,
  ParcelItem,
  ParcelOptions,
  ParcelPhoto,
} from "@/lib/parcels";
import { ParcelCameraPhotos } from "./ParcelCameraPhotos";
import { Button } from "./ui/Button";
import { DateField } from "./ui/DateField";
import { Input } from "./ui/Input";
import { Select } from "./ui/Select";

function toSelectOptions(items: ParcelChoice[]) {
  return items.map((i) => ({ id: i.id, label: i.label }));
}

/** Build m/d/Y g:i a from date MM/dd/yyyy + HH:mm */
function combineDateTime(dateMdY: string, timeHm: string): string {
  const d = dateMdY.trim();
  const t = timeHm.trim() || "12:00";
  if (!d) return "";
  const [hhRaw, mmRaw] = t.split(":");
  let hh = Number(hhRaw);
  const mm = Number(mmRaw || 0);
  if (Number.isNaN(hh)) hh = 12;
  const ampm = hh >= 12 ? "pm" : "am";
  let h12 = hh % 12;
  if (h12 === 0) h12 = 12;
  const mmPad = String(mm).padStart(2, "0");
  return `${d} ${h12}:${mmPad} ${ampm}`;
}

function splitDeliveredOn(value?: string): { date: string; time: string } {
  if (!value?.trim()) {
    const now = new Date();
    const date = `${String(now.getMonth() + 1).padStart(2, "0")}/${String(now.getDate()).padStart(2, "0")}/${now.getFullYear()}`;
    const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    return { date, time };
  }
  // Expect m/d/Y g:i a
  const m = value.match(
    /^(\d{1,2}\/\d{1,2}\/\d{4})\s+(\d{1,2}):(\d{2})\s*(am|pm)$/i
  );
  if (!m) {
    return { date: value, time: "12:00" };
  }
  let hh = Number(m[2]);
  const mm = m[3];
  const ap = m[4].toLowerCase();
  if (ap === "pm" && hh < 12) hh += 12;
  if (ap === "am" && hh === 12) hh = 0;
  return {
    date: m[1],
    time: `${String(hh).padStart(2, "0")}:${mm}`,
  };
}

export function ParcelForm({ parcel }: { parcel?: ParcelItem | null }) {
  const router = useRouter();
  const isEdit = Boolean(parcel?.id);
  const split = splitDeliveredOn(parcel?.parcel_delivered_on);
  const [units, setUnits] = useState<ParcelChoice[]>([]);
  const [types, setTypes] = useState<ParcelChoice[]>([]);
  const [staff, setStaff] = useState<ParcelChoice[]>([]);
  const [residents, setResidents] = useState<ParcelChoice[]>([]);
  const [form, setForm] = useState({
    parcel_recipient: parcel?.parcel_recipient
      ? String(parcel.parcel_recipient)
      : "",
    parcel_resident: parcel?.parcel_resident
      ? String(parcel.parcel_resident)
      : "",
    parcel_type: parcel?.parcel_type ? String(parcel.parcel_type) : "",
    parcel_type_other: parcel?.parcel_type_other || "",
    parcel_received_by: parcel?.parcel_received_by
      ? String(parcel.parcel_received_by)
      : "",
    parcel_number: parcel?.parcel_number ? String(parcel.parcel_number) : "1",
    comments_parcel_barcode: parcel?.comments_parcel_barcode || "",
    delivered_date: split.date,
    delivered_time: split.time,
    notify_email: false,
  });
  const [photos, setPhotos] = useState<ParcelPhoto[]>(parcel?.photos || []);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/wp/parcels/options")
      .then((r) => r.json())
      .then((data: ParcelOptions) => {
        setUnits(data.units || []);
        setTypes(data.parcel_types || []);
        setStaff(data.staff || []);
        if (!form.parcel_received_by && data.current_user) {
          setForm((f) => ({
            ...f,
            parcel_received_by: String(data.current_user),
          }));
        }
      })
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!form.parcel_recipient) {
      setResidents([]);
      return;
    }
    fetch(
      `/api/wp/parcels/options?unit_id=${encodeURIComponent(form.parcel_recipient)}`
    )
      .then((r) => r.json())
      .then((data: ParcelOptions) => setResidents(data.residents || []))
      .catch(() => setResidents([]));
  }, [form.parcel_recipient]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const url = isEdit ? `/api/wp/parcels/${parcel!.id}` : "/api/wp/parcels";
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parcel_recipient: Number(form.parcel_recipient),
          parcel_resident: Number(form.parcel_resident),
          parcel_type: form.parcel_type ? Number(form.parcel_type) : 0,
          parcel_type_other: form.parcel_type_other,
          parcel_received_by: Number(form.parcel_received_by),
          parcel_number: Number(form.parcel_number) || 1,
          comments_parcel_barcode: form.comments_parcel_barcode,
          parcel_delivered_on: combineDateTime(
            form.delivered_date,
            form.delivered_time
          ),
          notify_email: form.notify_email,
          parcel_photo: photos.map((p) => p.id),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Could not save parcel.");
        return;
      }
      setMessage(data.message || "Saved.");
      setTimeout(() => {
        router.push("/account/parcels");
        router.refresh();
      }, 700);
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Select
        label="Unit"
        required
        options={toSelectOptions(units)}
        value={form.parcel_recipient}
        onChange={(e) =>
          setForm({
            ...form,
            parcel_recipient: e.target.value,
            parcel_resident: "",
          })
        }
      />
      <Select
        label="Resident"
        required
        options={toSelectOptions(residents)}
        value={form.parcel_resident}
        onChange={(e) => setForm({ ...form, parcel_resident: e.target.value })}
      />
      <Select
        label="Parcel type"
        placeholder="Optional"
        options={toSelectOptions(types)}
        value={form.parcel_type}
        onChange={(e) => setForm({ ...form, parcel_type: e.target.value })}
      />
      <Input
        label="Other parcel type"
        value={form.parcel_type_other}
        onChange={(e) =>
          setForm({ ...form, parcel_type_other: e.target.value })
        }
      />
      <Select
        label="Received by"
        required
        options={toSelectOptions(staff)}
        value={form.parcel_received_by}
        onChange={(e) =>
          setForm({ ...form, parcel_received_by: e.target.value })
        }
      />
      <Input
        label="Number of parcels"
        type="number"
        min={1}
        required
        value={form.parcel_number}
        onChange={(e) => setForm({ ...form, parcel_number: e.target.value })}
      />
      <DateField
        label="Delivered on (date)"
        value={form.delivered_date}
        onChange={(delivered_date) => setForm({ ...form, delivered_date })}
        required
      />
      <Input
        label="Delivered time"
        type="time"
        value={form.delivered_time}
        onChange={(e) => setForm({ ...form, delivered_time: e.target.value })}
      />
      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-[var(--muted)]">
          Comments / barcode
        </span>
        <textarea
          className="w-full rounded-xl border border-[var(--border)] bg-white px-3.5 py-3 outline-none ring-[var(--accent)] focus:ring-2"
          rows={3}
          value={form.comments_parcel_barcode}
          onChange={(e) =>
            setForm({ ...form, comments_parcel_barcode: e.target.value })
          }
        />
      </label>
      <ParcelCameraPhotos
        photos={photos}
        onChange={setPhotos}
        parcelId={parcel?.id}
        disabled={loading}
      />
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.notify_email}
          onChange={(e) =>
            setForm({ ...form, notify_email: e.target.checked })
          }
        />
        Email resident on save
      </label>
      {error ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {message}
        </p>
      ) : null}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Saving…" : isEdit ? "Update parcel" : "Create parcel"}
      </Button>
    </form>
  );
}

"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { GuestChoice, GuestItem, GuestOptions, GuestPhoto } from "@/lib/guests";
import { CameraCapturePhotos } from "./CameraCapturePhotos";
import { Button } from "./ui/Button";
import { DateField } from "./ui/DateField";
import { Input } from "./ui/Input";
import { Select } from "./ui/Select";

function toSelectOptions(items: GuestChoice[]) {
  return items.map((i) => ({ id: i.id, label: i.label }));
}

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

function splitDateTime(value?: string): { date: string; time: string } {
  if (!value?.trim()) {
    const now = new Date();
    const date = `${String(now.getMonth() + 1).padStart(2, "0")}/${String(now.getDate()).padStart(2, "0")}/${now.getFullYear()}`;
    const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    return { date, time };
  }
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

export function GuestForm({
  guest,
  afterSaveHref = "/account/guests",
}: {
  guest?: GuestItem | null;
  afterSaveHref?: string;
}) {
  const router = useRouter();
  const isEdit = Boolean(guest?.id);
  const checkInSplit = splitDateTime(guest?.guest_check_in);
  const checkOutSplit = guest?.guest_check_out
    ? splitDateTime(guest.guest_check_out)
    : { date: "", time: "" };
  const [units, setUnits] = useState<GuestChoice[]>([]);
  const [form, setForm] = useState({
    guest_unit: guest?.guest_unit ? String(guest.guest_unit) : "",
    guest_names: guest?.guest_names || "",
    guest_phone: guest?.guest_phone || "",
    guest_number: guest?.guest_number ? String(guest.guest_number) : "1",
    check_in_date: checkInSplit.date,
    check_in_time: checkInSplit.time,
    check_out_date: checkOutSplit.date,
    check_out_time: checkOutSplit.time,
    guest_have_vehicle: Boolean(guest?.guest_have_vehicle),
    guest_parking_stall: guest?.guest_parking_stall || "",
    guest_license_plate: guest?.guest_license_plate || "",
    guest_car_make: guest?.guest_car_make || "",
    guest_car_model: guest?.guest_car_model || "",
    guest_car_color: guest?.guest_car_color || "",
    guest_car_year: guest?.guest_car_year || "",
  });
  const [photos, setPhotos] = useState<GuestPhoto[]>(guest?.photos || []);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/wp/guests/options")
      .then((r) => r.json())
      .then((data: GuestOptions) => setUnits(data.units || []))
      .catch(() => undefined);
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const url = isEdit ? `/api/wp/guests/${guest!.id}` : "/api/wp/guests";
      const body: Record<string, unknown> = {
        guest_unit: Number(form.guest_unit),
        guest_names: form.guest_names,
        guest_phone: form.guest_phone,
        guest_number: Number(form.guest_number) || 1,
        guest_check_in: combineDateTime(form.check_in_date, form.check_in_time),
        guest_have_vehicle: form.guest_have_vehicle,
        guest_parking_stall: form.guest_parking_stall,
        guest_license_plate: form.guest_license_plate,
        guest_car_make: form.guest_car_make,
        guest_car_model: form.guest_car_model,
        guest_car_color: form.guest_car_color,
        guest_car_year: form.guest_car_year,
        guest_photo: photos.map((p) => p.id),
      };
      if (isEdit) {
        body.guest_check_out =
          form.check_out_date.trim() && form.check_out_time.trim()
            ? combineDateTime(form.check_out_date, form.check_out_time)
            : "";
      }
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Could not save guest.");
        return;
      }
      setMessage(data.message || "Saved.");
      setTimeout(() => {
        router.push(afterSaveHref);
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
      <div className="ceo-form-row">
        <Select
          label="Unit"
          required
          options={toSelectOptions(units)}
          value={form.guest_unit}
          onChange={(e) => setForm({ ...form, guest_unit: e.target.value })}
        />
        <Input
          label="Number of guests"
          type="number"
          min={1}
          max={10}
          required
          value={form.guest_number}
          onChange={(e) => setForm({ ...form, guest_number: e.target.value })}
        />
      </div>
      <div className="ceo-form-row">
        <Input
          label="Guest name/s"
          required
          value={form.guest_names}
          onChange={(e) => setForm({ ...form, guest_names: e.target.value })}
        />
        <Input
          label="Phone"
          required
          value={form.guest_phone}
          onChange={(e) => setForm({ ...form, guest_phone: e.target.value })}
        />
      </div>
      <div className="ceo-form-row">
        <DateField
          label="Check in date"
          required
          value={form.check_in_date}
          onChange={(value) => setForm({ ...form, check_in_date: value })}
        />
        <Input
          label="Check in time"
          type="time"
          required
          value={form.check_in_time}
          onChange={(e) => setForm({ ...form, check_in_time: e.target.value })}
        />
      </div>
      {isEdit ? (
        <div className="ceo-form-row">
          <DateField
            label="Check out date"
            value={form.check_out_date}
            onChange={(value) => setForm({ ...form, check_out_date: value })}
          />
          <Input
            label="Check out time"
            type="time"
            value={form.check_out_time}
            onChange={(e) =>
              setForm({ ...form, check_out_time: e.target.value })
            }
          />
        </div>
      ) : null}

      <label className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3.5 py-3">
        <input
          type="checkbox"
          className="h-4 w-4 accent-[var(--accent)]"
          checked={form.guest_have_vehicle}
          onChange={(e) =>
            setForm({ ...form, guest_have_vehicle: e.target.checked })
          }
        />
        <span className="text-sm font-medium text-[var(--ink)]">
          Have vehicle?
        </span>
      </label>

      {form.guest_have_vehicle ? (
        <>
          <div className="ceo-form-row">
            <Input
              label="License plate"
              value={form.guest_license_plate}
              onChange={(e) =>
                setForm({ ...form, guest_license_plate: e.target.value })
              }
            />
            <Input
              label="Parking stall #"
              value={form.guest_parking_stall}
              onChange={(e) =>
                setForm({ ...form, guest_parking_stall: e.target.value })
              }
            />
          </div>
          <div className="ceo-form-row">
            <Input
              label="Car make"
              required
              value={form.guest_car_make}
              onChange={(e) =>
                setForm({ ...form, guest_car_make: e.target.value })
              }
            />
            <Input
              label="Car model"
              required
              value={form.guest_car_model}
              onChange={(e) =>
                setForm({ ...form, guest_car_model: e.target.value })
              }
            />
          </div>
          <div className="ceo-form-row">
            <Input
              label="Car color"
              required
              value={form.guest_car_color}
              onChange={(e) =>
                setForm({ ...form, guest_car_color: e.target.value })
              }
            />
            <Input
              label="Car year"
              value={form.guest_car_year}
              onChange={(e) =>
                setForm({ ...form, guest_car_year: e.target.value })
              }
            />
          </div>
        </>
      ) : null}

      <CameraCapturePhotos
        photos={photos}
        onChange={setPhotos}
        uploadUrl="/api/wp/guests/media"
        parentIdKey="guest_id"
        parentId={guest?.id}
        disabled={loading}
      />

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
        {loading ? "Saving…" : isEdit ? "Update guest" : "Save guest"}
      </Button>
    </form>
  );
}

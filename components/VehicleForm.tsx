"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Choice, VehicleItem } from "@/lib/additional-info";
import { ProfileAvatarField } from "./ProfileAvatarField";
import { Button } from "./ui/Button";
import { DateField } from "./ui/DateField";
import { Input } from "./ui/Input";
import { Select } from "./ui/Select";

export function VehicleForm({
  vehicle,
  afterSaveHref = "/account/additional-info",
}: {
  vehicle?: VehicleItem | null;
  afterSaveHref?: string;
}) {
  const router = useRouter();
  const isEdit = Boolean(vehicle?.id);
  const [years, setYears] = useState<Choice[]>([]);
  const [makes, setMakes] = useState<Choice[]>([]);
  const [models, setModels] = useState<Choice[]>([]);
  const [form, setForm] = useState({
    year: vehicle?.year || "",
    make: vehicle?.make || "",
    model: vehicle?.model || "",
    color: vehicle?.color || "",
    license_plate: vehicle?.license_plate || "",
    state: vehicle?.state || "",
    scantag: vehicle?.scantag || "",
    expiry: vehicle?.expiry || "",
    electric_vehicle: Boolean(vehicle?.electric_vehicle),
    active: vehicle?.active !== false,
  });
  const [photoId, setPhotoId] = useState(vehicle?.photo_id || 0);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/wp/additional-info/options?section=vehicles")
      .then((r) => r.json())
      .then((data) => {
        setYears(data.years || []);
        setMakes(data.makes || []);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!form.make || form.make === "Unknown") {
      setModels([]);
      return;
    }
    fetch(
      `/api/wp/additional-info/options?section=vehicles&make=${encodeURIComponent(form.make)}`
    )
      .then((r) => r.json())
      .then((data) => setModels(data.models || []))
      .catch(() => setModels([]));
  }, [form.make]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const url = isEdit
        ? `/api/wp/additional-info/vehicles/${vehicle!.id}`
        : "/api/wp/additional-info/vehicles";
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          ...(photoId > 0 ? { photo_id: photoId } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Could not save vehicle.");
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
      <ProfileAvatarField
        avatar={vehicle?.photo}
        initials={(form.make || "V").slice(0, 1).toUpperCase()}
        uploadUrl="/api/wp/additional-info/media"
        parentId={vehicle?.id}
        title="Vehicle photo"
        subtitle={
          isEdit
            ? "This is the picture on the vehicle card. Save the form after you change it."
            : "Add a picture for the vehicle card."
        }
        onPendingChange={(next) => {
          if (next?.id) setPhotoId(next.id);
        }}
      />
      <Select
        label="Year"
        options={years}
        value={form.year}
        onChange={(e) => setForm({ ...form, year: e.target.value })}
      />
      <Select
        label="Make"
        required
        options={makes}
        value={form.make}
        onChange={(e) => setForm({ ...form, make: e.target.value, model: "" })}
      />
      {form.make === "Unknown" || models.length === 0 ? (
        <Input
          label="Model"
          value={form.model}
          onChange={(e) => setForm({ ...form, model: e.target.value })}
        />
      ) : (
        <Select
          label="Model"
          options={models}
          value={form.model}
          onChange={(e) => setForm({ ...form, model: e.target.value })}
        />
      )}
      <Input
        label="Color"
        value={form.color}
        onChange={(e) => setForm({ ...form, color: e.target.value })}
      />
      <Input
        label="License plate"
        value={form.license_plate}
        onChange={(e) => setForm({ ...form, license_plate: e.target.value })}
      />
      <Input
        label="State"
        value={form.state}
        onChange={(e) => setForm({ ...form, state: e.target.value })}
      />
      <Input
        label="Tag / scan number"
        value={form.scantag}
        onChange={(e) => setForm({ ...form, scantag: e.target.value })}
      />
      <DateField
        label="Expiration"
        value={form.expiry}
        onChange={(expiry) => setForm({ ...form, expiry })}
      />
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.electric_vehicle}
          onChange={(e) =>
            setForm({ ...form, electric_vehicle: e.target.checked })
          }
        />
        Electric vehicle
      </label>
      {error ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}
      {message ? (
        <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {message}
        </p>
      ) : null}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Saving…" : isEdit ? "Update vehicle" : "Add vehicle"}
      </Button>
    </form>
  );
}

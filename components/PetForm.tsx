"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Choice, PetItem } from "@/lib/additional-info";
import { Button } from "./ui/Button";
import { DateField } from "./ui/DateField";
import { Input } from "./ui/Input";
import { Select } from "./ui/Select";

export function PetForm({ pet }: { pet?: PetItem | null }) {
  const router = useRouter();
  const isEdit = Boolean(pet?.id);
  const [types, setTypes] = useState<Choice[]>([]);
  const [form, setForm] = useState({
    type_id: pet?.type_id ? String(pet.type_id) : "",
    pet_name: pet?.pet_name || "",
    pet_breed: pet?.pet_breed || "",
    pet_weight: pet?.pet_weight || "",
    pet_dob: pet?.pet_dob || "",
    pet_microchip_number: pet?.pet_microchip_number || "",
    desc: pet?.desc || "",
    service_animal: Boolean(pet?.service_animal),
  });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/wp/additional-info/options?section=pets")
      .then((r) => r.json())
      .then((data) => setTypes(data.pet_types || []))
      .catch(() => setTypes([]));
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const url = isEdit
        ? `/api/wp/additional-info/pets/${pet!.id}`
        : "/api/wp/additional-info/pets";
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          type_id: Number(form.type_id),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Could not save pet.");
        return;
      }
      setMessage(data.message || "Saved.");
      setTimeout(() => {
        router.push("/account/additional-info");
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
        label="Pet type"
        name="type_id"
        required
        options={types}
        value={form.type_id}
        onChange={(e) => setForm({ ...form, type_id: e.target.value })}
      />
      <Input
        label="Pet name"
        required
        value={form.pet_name}
        onChange={(e) => setForm({ ...form, pet_name: e.target.value })}
      />
      <Input
        label="Breed (optional)"
        value={form.pet_breed}
        onChange={(e) => setForm({ ...form, pet_breed: e.target.value })}
      />
      <Input
        label="Weight (optional)"
        value={form.pet_weight}
        onChange={(e) => setForm({ ...form, pet_weight: e.target.value })}
      />
      <DateField
        label="Birthday"
        value={form.pet_dob}
        onChange={(pet_dob) => setForm({ ...form, pet_dob })}
        toDate={new Date()}
      />
      <Input
        label="Microchip number"
        value={form.pet_microchip_number}
        onChange={(e) =>
          setForm({ ...form, pet_microchip_number: e.target.value })
        }
      />
      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-[var(--muted)]">
          Notes / description
        </span>
        <textarea
          className="w-full rounded-xl border border-[var(--border)] bg-white px-3.5 py-3 outline-none ring-[var(--accent)] focus:ring-2"
          rows={3}
          value={form.desc}
          onChange={(e) => setForm({ ...form, desc: e.target.value })}
        />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.service_animal}
          onChange={(e) =>
            setForm({ ...form, service_animal: e.target.checked })
          }
        />
        Service animal
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
        {loading ? "Saving…" : isEdit ? "Update pet" : "Add pet"}
      </Button>
    </form>
  );
}

"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Choice, PreferenceItem } from "@/lib/additional-info";
import { Button } from "./ui/Button";
import { Select } from "./ui/Select";

export function PreferenceForm({
  preference,
}: {
  preference?: PreferenceItem | null;
}) {
  const router = useRouter();
  const isEdit = Boolean(preference?.id);
  const [categories, setCategories] = useState<Choice[]>([]);
  const [subcategories, setSubcategories] = useState<Choice[]>([]);
  const [typeChoices, setTypeChoices] = useState<Choice[]>([]);
  const [form, setForm] = useState({
    category_id: preference?.category_id ? String(preference.category_id) : "",
    subcategory_id: preference?.subcategory_id
      ? String(preference.subcategory_id)
      : "",
    types: preference?.types || ([] as string[]),
    description: preference?.description || "",
    critical: Boolean(preference?.critical),
    visibility: preference?.visibility || "",
  });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/wp/additional-info/options?section=preferences")
      .then((r) => r.json())
      .then((data) => setCategories(data.categories || []))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    if (!form.category_id) {
      setSubcategories([]);
      return;
    }
    fetch(
      `/api/wp/additional-info/options?section=preferences&category_id=${form.category_id}`
    )
      .then((r) => r.json())
      .then((data) => setSubcategories(data.subcategories || []))
      .catch(() => setSubcategories([]));
  }, [form.category_id]);

  useEffect(() => {
    if (!form.category_id || !form.subcategory_id) {
      setTypeChoices([]);
      return;
    }
    fetch(
      `/api/wp/additional-info/options?section=preferences&category_id=${form.category_id}&subcategory_id=${form.subcategory_id}`
    )
      .then((r) => r.json())
      .then((data) => setTypeChoices(data.types || []))
      .catch(() => setTypeChoices([]));
  }, [form.category_id, form.subcategory_id]);

  function toggleType(value: string) {
    setForm((prev) => {
      const has = prev.types.includes(value);
      return {
        ...prev,
        types: has
          ? prev.types.filter((t) => t !== value)
          : [...prev.types, value],
      };
    });
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const url = isEdit
        ? `/api/wp/additional-info/preferences/${preference!.id}`
        : "/api/wp/additional-info/preferences";
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          category_id: Number(form.category_id),
          subcategory_id: Number(form.subcategory_id),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Could not save preference.");
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
        label="Category"
        required
        options={categories}
        value={form.category_id}
        onChange={(e) =>
          setForm({
            ...form,
            category_id: e.target.value,
            subcategory_id: "",
            types: [],
          })
        }
      />
      <Select
        label="Subcategory"
        required
        options={subcategories}
        value={form.subcategory_id}
        onChange={(e) =>
          setForm({ ...form, subcategory_id: e.target.value, types: [] })
        }
      />
      {typeChoices.length > 0 ? (
        <div className="space-y-2">
          <p className="text-sm font-medium text-[var(--muted)]">Types</p>
          <div className="space-y-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
            {typeChoices.map((t) => (
              <label key={String(t.id)} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.types.includes(String(t.id))}
                  onChange={() => toggleType(String(t.id))}
                />
                {t.label}
              </label>
            ))}
          </div>
        </div>
      ) : null}
      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-[var(--muted)]">
          Description
        </span>
        <textarea
          className="w-full rounded-xl border border-[var(--border)] bg-white px-3.5 py-3 outline-none ring-[var(--accent)] focus:ring-2"
          rows={3}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.critical}
          onChange={(e) => setForm({ ...form, critical: e.target.checked })}
        />
        Critical
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
        {loading
          ? "Saving…"
          : isEdit
            ? "Update preference"
            : "Add preference"}
      </Button>
    </form>
  );
}

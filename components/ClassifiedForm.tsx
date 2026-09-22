"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClassified } from "@/lib/helpers/classifieds";
import { formatAppError } from "@/lib/helpers/errors";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Select } from "./ui/Select";

const CATEGORIES = [
  { id: "for_sale", label: "For sale" },
  { id: "wanted", label: "Wanted" },
  { id: "free", label: "Free" },
];

export function ClassifiedForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("for_sale");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await createClassified({
      title: title.trim(),
      description: description.trim(),
      category,
      price: category === "free" ? "Free" : price.trim(),
    });
    setBusy(false);
    if (!res.ok) {
      setError(res.error ? formatAppError(res.error) : "Could not post listing.");
      return;
    }
    router.push("/account/classifieds");
    router.refresh();
  }

  return (
    <form className="ceo-class-form" onSubmit={onSubmit}>
      <Input
        label="Title"
        name="title"
        value={title}
        required
        onChange={(e) => setTitle(e.target.value)}
      />
      <Select
        label="Type"
        name="category"
        value={category}
        options={CATEGORIES}
        onChange={(e) => setCategory(e.target.value)}
      />
      {category !== "free" ? (
        <Input
          label="Price"
          name="price"
          value={price}
          placeholder="$300"
          onChange={(e) => setPrice(e.target.value)}
        />
      ) : null}
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Description</span>
        <textarea
          name="description"
          value={description}
          rows={5}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3.5 py-3 text-[var(--ink)] outline-none ring-[var(--accent)] focus:ring-2"
        />
      </label>
      {error ? <p className="ceo-empty-note">{error}</p> : null}
      <Button type="submit" disabled={busy || !title.trim()}>
        {busy ? "Posting…" : "Post listing"}
      </Button>
    </form>
  );
}

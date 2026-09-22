"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { WarrantyChoice, WarrantyItem, WarrantyOptions } from "@/lib/warranties";
import { MenuSelect } from "./ui/MenuSelect";
import { CheckIcon } from "./ui/Icons";

/**
 * Robert (22 Sep Gorman): the step bar does not match their process.
 * Keep the markup; turn the flag on after he and Aries review the statuses.
 */
const SHOW_STATUS_STEPS = false;

export function WarrantyStatusForm({ record }: { record: WarrantyItem }) {
  const router = useRouter();
  const [statuses, setStatuses] = useState<WarrantyChoice[]>([]);
  const [value, setValue] = useState(
    record.warranty_status ? String(record.warranty_status) : ""
  );
  const [note, setNote] = useState("");
  const [notify, setNotify] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/wp/warranties/options?lite=1")
      .then((r) => r.json())
      .then((data: WarrantyOptions) => {
        const next = data.statuses || [];
        setStatuses(next);
        setValue((current) => {
          if (current) return current;
          if (data.default_status_id) return String(data.default_status_id);
          return next[0] ? String(next[0].id) : "";
        });
      })
      .catch(() => undefined);
  }, []);

  const currentIndex = useMemo(() => {
    const idx = statuses.findIndex((s) => String(s.id) === value);
    return idx >= 0 ? idx : 0;
  }, [statuses, value]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!value) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/wp/warranties/${record.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ warranty_status: Number(value) }),
      });
      const data = (await res.json()) as { message?: string };
      if (!res.ok) {
        setError(data.message || "Could not update status.");
        return;
      }
      router.push(`/account/warranties/${record.id}`);
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {SHOW_STATUS_STEPS && statuses.length ? (
        <ol className="ceo-stepper ceo-stepper--scroll">
          {statuses.map((status, i) => (
            <li
              key={String(status.id)}
              className={`ceo-stepper__step${i <= currentIndex ? " is-done" : ""}`}
            >
              <button
                type="button"
                className="ceo-stepper__hit"
                disabled={saving}
                onClick={() => setValue(String(status.id))}
                aria-current={String(status.id) === value ? "step" : undefined}
              >
                <span className="ceo-stepper__dot">
                  {i < currentIndex ? <CheckIcon className="h-3 w-3" /> : null}
                </span>
                <span className="ceo-stepper__label">{status.label}</span>
              </button>
            </li>
          ))}
        </ol>
      ) : null}
      {!SHOW_STATUS_STEPS && !statuses.length ? (
        <p className="text-sm text-[var(--muted)]">Loading statuses…</p>
      ) : null}

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-[var(--muted)]">Status</span>
        <MenuSelect
          variant="field"
          aria-label="Status"
          value={value}
          options={statuses}
          disabled={saving || !statuses.length}
          onChange={setValue}
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-[var(--muted)]">Update Notes</span>
        <textarea
          rows={4}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add a note for this status change."
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3.5 py-3 text-sm outline-none ring-[var(--accent)] focus:ring-2"
        />
      </label>

      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium">Notify contact</span>
        <button
          type="button"
          role="switch"
          aria-checked={notify}
          aria-label="Notify contact"
          className={`ceo-toggle${notify ? " is-on" : ""}`}
          onClick={() => setNotify((v) => !v)}
        >
          <span />
        </button>
      </div>

      <p className="text-xs text-[var(--muted)]">
        Notes and contact notification are not stored yet; only the status is saved.
      </p>

      {error ? (
        <p className="rounded-xl bg-[#3a1c1c] px-3 py-2 text-sm text-[var(--danger)]">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        className="ceo-btn-solid w-full"
        disabled={saving || !value}
      >
        {saving ? "Saving…" : "Update Status"}
      </button>
    </form>
  );
}

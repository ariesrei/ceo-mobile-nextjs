"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  WarrantyChoice,
  WarrantyItem,
  WarrantyOptions,
} from "@/lib/warranties";
import { Button } from "./ui/Button";
import { DateField } from "./ui/DateField";
import { Select } from "./ui/Select";

function toSelectOptions(items: WarrantyChoice[]) {
  return items.map((i) => ({ id: i.id, label: i.label }));
}

export function WarrantyAssignForm({ record }: { record: WarrantyItem }) {
  const router = useRouter();
  const [subcontractors, setSubcontractors] = useState<WarrantyChoice[]>([]);
  const [trades, setTrades] = useState<WarrantyChoice[]>([]);
  const [form, setForm] = useState({
    warranty_sources_subcontractors: record.warranty_sources_subcontractors
      ? String(record.warranty_sources_subcontractors)
      : "",
    warranty_sources_trade: (record.warranty_sources_trade || []).map(String),
    warranty_sources_target_due: record.warranty_sources_target_due || "",
    warranty_sources_internal_note:
      record.warranty_sources_internal_note || "",
  });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/wp/warranties/options")
      .then((r) => r.json())
      .then((data: WarrantyOptions) => {
        setSubcontractors(data.subcontractors || []);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!form.warranty_sources_subcontractors) {
      setTrades([]);
      return;
    }
    fetch(
      `/api/wp/warranties/options?subcontractor_id=${encodeURIComponent(
        form.warranty_sources_subcontractors
      )}`
    )
      .then((r) => r.json())
      .then((data: WarrantyOptions) => {
        const next = data.trades || [];
        setTrades(next);
        setForm((f) => ({
          ...f,
          warranty_sources_trade: f.warranty_sources_trade.filter((id) =>
            next.some((t) => String(t.id) === id)
          ),
        }));
      })
      .catch(() => setTrades([]));
  }, [form.warranty_sources_subcontractors]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch(`/api/wp/warranties/${record.id}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          warranty_sources_subcontractors: Number(
            form.warranty_sources_subcontractors
          ),
          warranty_sources_trade: form.warranty_sources_trade.map(Number),
          warranty_sources_target_due: form.warranty_sources_target_due,
          warranty_sources_internal_note: form.warranty_sources_internal_note,
        }),
      });
      const data = (await res.json()) as { message?: string };
      if (!res.ok) {
        setError(data.message || "Could not assign ticket.");
        return;
      }
      setMessage(data.message || "Ticket assigned.");
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
      <div className="rounded-xl bg-[var(--surface-2)] px-4 py-3">
        <p className="text-sm font-semibold">
          {record.warranty_describe_the_request ||
            record.warranty_describe_the_request_single ||
            record.title}
        </p>
        <p className="mt-1 text-xs text-[var(--muted)]">
          {[record.unit_title, record.resident_name || record.warranty_first_name]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>

      <div className="ceo-form-row">
        <Select
          label="Subcontractor"
          required
          value={form.warranty_sources_subcontractors}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              warranty_sources_subcontractors: e.target.value,
              warranty_sources_trade: [],
            }))
          }
          options={toSelectOptions(subcontractors)}
        />
        <DateField
          label="Target due date"
          required
          value={form.warranty_sources_target_due}
          onChange={(warranty_sources_target_due) =>
            setForm((f) => ({ ...f, warranty_sources_target_due }))
          }
        />
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-[var(--muted)]">
          Trades
        </legend>
        {trades.length ? (
          <ul className="space-y-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
            {trades.map((t) => {
              const id = String(t.id);
              const checked = form.warranty_sources_trade.includes(id);
              return (
                <li key={id}>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        setForm((f) => ({
                          ...f,
                          warranty_sources_trade: checked
                            ? f.warranty_sources_trade.filter((x) => x !== id)
                            : [...f.warranty_sources_trade, id],
                        }))
                      }
                    />
                    {t.label}
                  </label>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-2)] px-3 py-3 text-sm text-[var(--muted)]">
            {form.warranty_sources_subcontractors
              ? "No trades found for this subcontractor."
              : "Select a subcontractor to load trades."}
          </p>
        )}
      </fieldset>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-[var(--muted)]">
          Internal notes
        </span>
        <textarea
          required
          rows={3}
          value={form.warranty_sources_internal_note}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              warranty_sources_internal_note: e.target.value,
            }))
          }
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3.5 py-3 text-[var(--ink)] outline-none ring-[var(--accent)] focus:ring-2"
        />
      </label>

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
        {loading ? "Assigning…" : "Assign Subcontractor"}
      </Button>
    </form>
  );
}

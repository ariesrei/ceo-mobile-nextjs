"use client";

import { FormEvent, useState } from "react";
import type {
  WarrantyChoice,
  WarrantyVendorStaff,
  WarrantyVendorTrade,
} from "@/lib/warranties";
import { saveWarrantyVendorTrade } from "@/lib/helpers/warranties";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Select } from "./ui/Select";

const PRIORITY_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((id) => ({
  id,
  label: String(id),
}));

export function WarrantyVendorTradeForm({
  vendorId,
  trade,
  tradeTypes,
  staff,
  onSaved,
}: {
  vendorId: number | string;
  trade?: WarrantyVendorTrade;
  tradeTypes: WarrantyChoice[];
  staff: WarrantyVendorStaff[];
  onSaved: (next: WarrantyVendorTrade) => void;
}) {
  const [tradeId, setTradeId] = useState(String(trade?.trade_id || ""));
  const [coverage, setCoverage] = useState(trade?.coverage || "");
  const [priority, setPriority] = useState(trade?.priority || "1");
  const [sla, setSla] = useState(trade?.sla || "");
  const [staffIds, setStaffIds] = useState<number[]>(
    trade?.staff_ids?.length
      ? trade.staff_ids
      : (trade?.staff || [])
          .map((person) => person.id || 0)
          .filter((id) => id > 0)
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function toggleStaff(id: number) {
    setStaffIds((prev) =>
      prev.includes(id) ? prev.filter((row) => row !== id) : [...prev, id]
    );
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const nextTradeId = Number(tradeId);
    if (!nextTradeId) {
      setError("Trade type is required.");
      return;
    }
    setSaving(true);
    setError("");
    const result = await saveWarrantyVendorTrade(vendorId, {
      id: Number(trade?.id) || undefined,
      trade_id: nextTradeId,
      coverage,
      priority,
      sla,
      staff_ids: staffIds,
    });
    setSaving(false);
    if (!result.ok) {
      setError(result.message || "Could not save trade.");
      return;
    }
    const label =
      tradeTypes.find((row) => String(row.id) === String(nextTradeId))?.label ||
      trade?.label ||
      "Trade";
    onSaved(
      result.trade || {
        id: trade?.id || nextTradeId,
        trade_id: nextTradeId,
        label,
        coverage,
        priority,
        sla,
        staff: staff.filter((person) => person.id && staffIds.includes(person.id)),
        staff_ids: staffIds,
      }
    );
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <Select
        label="Trade type"
        name="trade_id"
        required
        searchable
        value={tradeId}
        options={tradeTypes}
        onChange={(e) => setTradeId(e.target.value)}
      />
      <Input
        label="Coverage area"
        name="coverage"
        value={coverage}
        placeholder="Area 1, Area 2"
        onChange={(e) => setCoverage(e.target.value)}
      />
      <Select
        label="Priority rank"
        name="priority"
        value={priority}
        options={PRIORITY_OPTIONS}
        onChange={(e) => setPriority(e.target.value)}
      />
      <Input
        label="SLA hours"
        name="sla"
        value={sla}
        placeholder="8:00 am to 5:00 pm"
        onChange={(e) => setSla(e.target.value)}
      />

      <div className="space-y-2">
        <p className="text-sm font-medium">Assign staff</p>
        {staff.length ? (
          staff.map((person) => {
            const id = person.id || 0;
            if (!id) return null;
            return (
              <label
                key={id}
                className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-3 text-sm"
              >
                <input
                  type="checkbox"
                  checked={staffIds.includes(id)}
                  onChange={() => toggleStaff(id)}
                />
                <span className="min-w-0">
                  <span className="block font-medium">{person.name}</span>
                  {person.job_title ? (
                    <span className="block text-xs text-[var(--muted)]">
                      {person.job_title}
                    </span>
                  ) : null}
                </span>
              </label>
            );
          })
        ) : (
          <p className="text-sm text-[var(--muted)]">
            Add staff first, then assign them here.
          </p>
        )}
      </div>

      {error ? (
        <p className="rounded-xl bg-[#3a1c1c] px-3 py-2 text-sm text-[var(--danger)]">
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={saving} className="w-full">
        {saving ? "Saving…" : trade ? "Save trade" : "Add trade"}
      </Button>
    </form>
  );
}

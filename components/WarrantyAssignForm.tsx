"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  WarrantyChoice,
  WarrantyItem,
  WarrantyOptions,
} from "@/lib/warranties";
import { ClaimThumb, claimContactName, claimMetaLines, claimThumbSrc } from "./ClaimThumb";
import { DateField } from "./ui/DateField";
import { SearchIcon } from "./ui/Icons";

export function WarrantyAssignForm({ record }: { record: WarrantyItem }) {
  const router = useRouter();
  const [subcontractors, setSubcontractors] = useState<WarrantyChoice[]>([]);
  const [vendorSearch, setVendorSearch] = useState("");
  const [form, setForm] = useState({
    warranty_sources_subcontractors: record.warranty_sources_subcontractors
      ? String(record.warranty_sources_subcontractors)
      : "",
    warranty_sources_target_due: record.warranty_sources_target_due || "",
    warranty_sources_internal_note: record.warranty_sources_internal_note || "",
  });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/wp/warranties/options?lite=1")
      .then((r) => r.json())
      .then((data: WarrantyOptions) => {
        setSubcontractors(data.subcontractors || []);
      })
      .catch(() => undefined);
  }, []);

  const vendors = useMemo(() => {
    const term = vendorSearch.trim().toLowerCase();
    if (!term) return subcontractors;
    return subcontractors.filter((s) => s.label.toLowerCase().includes(term));
  }, [subcontractors, vendorSearch]);

  const selectedLabel =
    subcontractors.find(
      (s) => String(s.id) === form.warranty_sources_subcontractors
    )?.label || "";

  const contact = claimContactName(record);
  const assignTitle =
    record.warranty_describe_the_request ||
    record.warranty_describe_the_request_single ||
    record.title;
  const assignMeta = claimMetaLines(record, assignTitle);

  function selectVendor(id: string) {
    setForm((f) => ({ ...f, warranty_sources_subcontractors: id }));
  }

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
          warranty_sources_trade: [],
          warranty_sources_target_due: form.warranty_sources_target_due,
          warranty_sources_internal_note:
            form.warranty_sources_internal_note.trim() ||
            "Assigned from the mobile app.",
        }),
      });
      const data = (await res.json()) as { message?: string };
      if (!res.ok) {
        setError(data.message || "Could not assign ticket.");
        return;
      }
      setMessage(data.message || "Ticket assigned.");
      router.push(`/account/warranties/${record.id}`);
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="ceo-claim-head">
        <ClaimThumb
          src={claimThumbSrc(record)}
          name={contact}
          size="head"
        />
        <div className="min-w-0 flex-1">
          <p className="ceo-claim-card__id">Claim #{record.id}</p>
          <p className="ceo-claim-head__title">
            {assignTitle}
          </p>
          {assignMeta.length ? (
            <p className="ceo-claim-card__meta mt-1">{assignMeta.join(" · ")}</p>
          ) : null}
        </div>
      </div>

      <fieldset className="space-y-2">
        <legend className="ceo-section-label">Subcontractor</legend>
        <div
          className={`ceo-assign-select${selectedLabel ? "" : " is-empty"}`}
          aria-live="polite"
        >
          <span>{selectedLabel || "Select subcontractor"}</span>
          <svg
            className="ceo-assign-select__chev"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
        <div className="ceo-claim-search">
          <span className="ceo-claim-search__icon-wrap" aria-hidden>
            <SearchIcon className="ceo-claim-search__icon" />
          </span>
          <input
            type="search"
            value={vendorSearch}
            onChange={(e) => setVendorSearch(e.target.value)}
            placeholder="Search vendors…"
            aria-label="Search vendors"
          />
        </div>
        {vendors.length ? (
          <ul className="ceo-assign-radios">
            {vendors.map((s) => {
              const id = String(s.id);
              const checked = form.warranty_sources_subcontractors === id;
              return (
                <li key={id}>
                  <label className={`ceo-radio${checked ? " is-on" : ""}`}>
                    <input
                      type="radio"
                      name="warranty_sources_subcontractors"
                      value={id}
                      checked={checked}
                      onChange={() => selectVendor(id)}
                    />
                    <span>{s.label}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="ceo-empty-note">
            {subcontractors.length
              ? "No vendors match your search."
              : "Loading vendors…"}
          </p>
        )}
      </fieldset>

      <DateField
        label="Estimated Start Date"
        showClear={false}
        value={form.warranty_sources_target_due}
        onChange={(warranty_sources_target_due) =>
          setForm((f) => ({ ...f, warranty_sources_target_due }))
        }
      />

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

      <button
        type="submit"
        className="ceo-btn-solid w-full"
        disabled={
          loading ||
          !form.warranty_sources_subcontractors ||
          !form.warranty_sources_target_due
        }
      >
        {loading ? "Assigning…" : "Assign"}
      </button>
    </form>
  );
}

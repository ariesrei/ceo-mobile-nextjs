"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  MaintenanceChoice,
  MaintenanceItem,
  MaintenanceOptions,
  MaintenancePhoto,
} from "@/lib/maintenance";
import { CameraCapturePhotos } from "./CameraCapturePhotos";
import { Button } from "./ui/Button";
import { DateField } from "./ui/DateField";
import { Select } from "./ui/Select";

function toSelectOptions(items: MaintenanceChoice[]) {
  return items.map((i) => ({ id: i.id, label: i.label }));
}

function todayMdY() {
  const now = new Date();
  return `${String(now.getMonth() + 1).padStart(2, "0")}/${String(now.getDate()).padStart(2, "0")}/${now.getFullYear()}`;
}

export function MaintenanceForm({
  record,
}: {
  record?: MaintenanceItem | null;
}) {
  const router = useRouter();
  const isEdit = Boolean(record?.id);
  const [units, setUnits] = useState<MaintenanceChoice[]>([]);
  const [types, setTypes] = useState<MaintenanceChoice[]>([]);
  const [statuses, setStatuses] = useState<MaintenanceChoice[]>([]);
  const [locations, setLocations] = useState<MaintenanceChoice[]>([]);
  const [departments, setDepartments] = useState<MaintenanceChoice[]>([]);
  const [staff, setStaff] = useState<MaintenanceChoice[]>([]);
  const [subcontractors, setSubcontractors] = useState<MaintenanceChoice[]>(
    []
  );
  const [trades, setTrades] = useState<MaintenanceChoice[]>([]);
  const [photos, setPhotos] = useState<MaintenancePhoto[]>(
    record?.photos || []
  );
  const [form, setForm] = useState({
    maintenance_type: record?.maintenance_type
      ? String(record.maintenance_type)
      : "",
    maintenance_priority: record?.maintenance_priority || "Medium",
    maintenance_date_request: record?.maintenance_date_request || todayMdY(),
    maintenance_request_by: record?.maintenance_request_by
      ? String(record.maintenance_request_by)
      : "",
    maintenance_description: record?.maintenance_description || "",
    maintenance_symptoms: record?.maintenance_symptoms || "",
    maintenance_unit: record?.maintenance_unit
      ? String(record.maintenance_unit)
      : "",
    maintenance_location: record?.maintenance_location
      ? String(record.maintenance_location)
      : "",
    maintenance_department: record?.maintenance_department
      ? String(record.maintenance_department)
      : "",
    maintenance_source: record?.maintenance_source || "Internal",
    maintenance_status: record?.maintenance_status
      ? String(record.maintenance_status)
      : "",
    maintenance_assigned_person: record?.maintenance_assigned_person
      ? String(record.maintenance_assigned_person)
      : "",
    maintenance_sources_subcontractors:
      record?.maintenance_sources_subcontractors
        ? String(record.maintenance_sources_subcontractors)
        : "",
    maintenance_sources_trade: (record?.maintenance_sources_trade || []).map(
      String
    ),
    maintenance_sources_target_due:
      record?.maintenance_sources_target_due || "",
    maintenance_sources_internal_note:
      record?.maintenance_sources_internal_note || "",
  });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/wp/maintenance/options")
      .then((r) => r.json())
      .then((data: MaintenanceOptions) => {
        setUnits(data.units || []);
        setTypes(data.types || []);
        setStatuses(data.statuses || []);
        setLocations(data.locations || []);
        setDepartments(data.departments || []);
        setStaff(data.staff || []);
        setSubcontractors(data.subcontractors || []);
        setForm((f) => {
          const next = { ...f };
          if (!next.maintenance_request_by && data.current_user) {
            next.maintenance_request_by = String(data.current_user);
          }
          if (!isEdit && !next.maintenance_status) {
            const assigned =
              data.default_status_id ||
              (data.statuses || []).find(
                (s) => s.label.toLowerCase() === "assigned"
              )?.id;
            if (assigned) {
              next.maintenance_status = String(assigned);
            }
          }
          return next;
        });
      })
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (form.maintenance_source !== "External") {
      setTrades([]);
      return;
    }
    const q = form.maintenance_sources_subcontractors
      ? `?subcontractor_id=${encodeURIComponent(form.maintenance_sources_subcontractors)}`
      : "";
    fetch(`/api/wp/maintenance/options${q}`)
      .then((r) => r.json())
      .then((data: MaintenanceOptions) => {
        setTrades(data.trades || []);
        setForm((f) => ({
          ...f,
          maintenance_sources_trade: f.maintenance_sources_trade.filter((id) =>
            (data.trades || []).some((t) => String(t.id) === id)
          ),
        }));
      })
      .catch(() => setTrades([]));
  }, [form.maintenance_source, form.maintenance_sources_subcontractors]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const url = isEdit
        ? `/api/wp/maintenance/${record!.id}`
        : "/api/wp/maintenance";
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          maintenance_type: form.maintenance_type
            ? Number(form.maintenance_type)
            : 0,
          maintenance_priority: form.maintenance_priority,
          maintenance_date_request: form.maintenance_date_request,
          maintenance_request_by: Number(form.maintenance_request_by) || 0,
          maintenance_description: form.maintenance_description,
          maintenance_symptoms: form.maintenance_symptoms,
          maintenance_unit: form.maintenance_unit
            ? Number(form.maintenance_unit)
            : 0,
          maintenance_location: form.maintenance_location
            ? Number(form.maintenance_location)
            : 0,
          maintenance_department: form.maintenance_department
            ? Number(form.maintenance_department)
            : 0,
          maintenance_source: form.maintenance_source,
          maintenance_status: form.maintenance_status
            ? Number(form.maintenance_status)
            : 0,
          maintenance_assigned_person:
            form.maintenance_source === "Internal" &&
            form.maintenance_assigned_person
              ? Number(form.maintenance_assigned_person)
              : 0,
          maintenance_sources_subcontractors:
            form.maintenance_source === "External" &&
            form.maintenance_sources_subcontractors
              ? Number(form.maintenance_sources_subcontractors)
              : 0,
          maintenance_sources_trade:
            form.maintenance_source === "External"
              ? form.maintenance_sources_trade.map(Number)
              : [],
          maintenance_sources_target_due:
            form.maintenance_source === "External"
              ? form.maintenance_sources_target_due
              : "",
          maintenance_sources_internal_note:
            form.maintenance_source === "External"
              ? form.maintenance_sources_internal_note
              : "",
          maintenance_photo: photos.map((p) => p.id),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Could not save maintenance.");
        return;
      }
      setMessage(data.message || "Saved.");
      setTimeout(() => {
        router.push("/account/maintenance");
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
        label="Type"
        required
        options={toSelectOptions(types)}
        value={form.maintenance_type}
        onChange={(e) =>
          setForm({ ...form, maintenance_type: e.target.value })
        }
      />
      <Select
        label="Priority"
        required
        options={[
          { id: "High", label: "High" },
          { id: "Medium", label: "Medium" },
          { id: "Low", label: "Low" },
        ]}
        value={form.maintenance_priority}
        onChange={(e) =>
          setForm({ ...form, maintenance_priority: e.target.value })
        }
      />
      <DateField
        label="Date of request"
        value={form.maintenance_date_request}
        onChange={(maintenance_date_request) =>
          setForm({ ...form, maintenance_date_request })
        }
        required
      />
      <Select
        label="Requested by"
        required
        options={toSelectOptions(staff)}
        value={form.maintenance_request_by}
        onChange={(e) =>
          setForm({ ...form, maintenance_request_by: e.target.value })
        }
      />
      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-[var(--muted)]">
          Description
        </span>
        <textarea
          className="w-full rounded-xl border border-[var(--border)] bg-white px-3.5 py-3 outline-none ring-[var(--accent)] focus:ring-2"
          rows={3}
          required
          value={form.maintenance_description}
          onChange={(e) =>
            setForm({ ...form, maintenance_description: e.target.value })
          }
        />
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-[var(--muted)]">
          Other notes
        </span>
        <textarea
          className="w-full rounded-xl border border-[var(--border)] bg-white px-3.5 py-3 outline-none ring-[var(--accent)] focus:ring-2"
          rows={2}
          value={form.maintenance_symptoms}
          onChange={(e) =>
            setForm({ ...form, maintenance_symptoms: e.target.value })
          }
        />
      </label>
      <Select
        label="Unit"
        placeholder="Optional"
        options={toSelectOptions(units)}
        value={form.maintenance_unit}
        onChange={(e) =>
          setForm({ ...form, maintenance_unit: e.target.value })
        }
      />
      <Select
        label="Location"
        placeholder="Optional"
        options={toSelectOptions(locations)}
        value={form.maintenance_location}
        onChange={(e) =>
          setForm({ ...form, maintenance_location: e.target.value })
        }
      />
      <Select
        label="Department"
        placeholder="Optional"
        options={toSelectOptions(departments)}
        value={form.maintenance_department}
        onChange={(e) =>
          setForm({ ...form, maintenance_department: e.target.value })
        }
      />
      <Select
        label="Personnel"
        required
        options={[
          { id: "Internal", label: "Internal" },
          { id: "External", label: "External" },
        ]}
        value={form.maintenance_source}
        onChange={(e) =>
          setForm({
            ...form,
            maintenance_source: e.target.value,
            maintenance_sources_trade: [],
          })
        }
      />
      {form.maintenance_source === "Internal" ? (
        <Select
          label="Assigned person"
          placeholder="Optional"
          options={toSelectOptions(staff)}
          value={form.maintenance_assigned_person}
          onChange={(e) =>
            setForm({ ...form, maintenance_assigned_person: e.target.value })
          }
        />
      ) : null}
      {form.maintenance_source === "External" ? (
        <>
          <Select
            label="Subcontractor"
            required
            options={toSelectOptions(subcontractors)}
            value={form.maintenance_sources_subcontractors}
            onChange={(e) =>
              setForm({
                ...form,
                maintenance_sources_subcontractors: e.target.value,
                maintenance_sources_trade: [],
              })
            }
          />
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-[var(--muted)]">
              Trades
            </legend>
            {trades.length ? (
              <ul className="space-y-2 rounded-xl border border-[var(--border)] bg-white p-3">
                {trades.map((t) => {
                  const id = String(t.id);
                  const checked = form.maintenance_sources_trade.includes(id);
                  return (
                    <li key={id}>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            setForm({
                              ...form,
                              maintenance_sources_trade: checked
                                ? form.maintenance_sources_trade.filter(
                                    (x) => x !== id
                                  )
                                : [...form.maintenance_sources_trade, id],
                            });
                          }}
                        />
                        {t.label}
                      </label>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-2)] px-3 py-3 text-sm text-[var(--muted)]">
                {form.maintenance_sources_subcontractors
                  ? "No trades found for this subcontractor."
                  : "Select a subcontractor to load trades."}
              </p>
            )}
          </fieldset>
          <DateField
            label="Target due date"
            value={form.maintenance_sources_target_due}
            onChange={(maintenance_sources_target_due) =>
              setForm({ ...form, maintenance_sources_target_due })
            }
            required
          />
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-[var(--muted)]">
              Internal notes
            </span>
            <textarea
              className="w-full rounded-xl border border-[var(--border)] bg-white px-3.5 py-3 outline-none ring-[var(--accent)] focus:ring-2"
              rows={3}
              required
              value={form.maintenance_sources_internal_note}
              onChange={(e) =>
                setForm({
                  ...form,
                  maintenance_sources_internal_note: e.target.value,
                })
              }
            />
          </label>
        </>
      ) : null}
      <Select
        label="Status"
        required
        options={toSelectOptions(statuses)}
        value={form.maintenance_status}
        onChange={(e) =>
          setForm({ ...form, maintenance_status: e.target.value })
        }
      />
      <CameraCapturePhotos
        photos={photos}
        onChange={setPhotos}
        uploadUrl="/api/wp/maintenance/media"
        parentIdKey="maintenance_id"
        parentId={record?.id}
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
        {loading
          ? "Saving…"
          : isEdit
            ? "Update maintenance"
            : "Create maintenance"}
      </Button>
    </form>
  );
}

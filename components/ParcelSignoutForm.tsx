"use client";

import { useEffect, useMemo, useState } from "react";
import { signOutParcel } from "@/lib/helpers/parcels";
import { Input } from "./ui/Input";
import { MenuSelect } from "./ui/MenuSelect";
import { SignaturePadField } from "./SignaturePadField";

const SIGNED_OUT_BY = ["Resident", "Others", "Staff"] as const;
type SignedOutBy = (typeof SIGNED_OUT_BY)[number];

function nowParts() {
  const now = new Date();
  return {
    date: `${String(now.getMonth() + 1).padStart(2, "0")}/${String(now.getDate()).padStart(2, "0")}/${now.getFullYear()}`,
    time: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
  };
}

function toIsoDate(mdy: string) {
  const m = mdy.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return "";
  return `${m[3]}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}`;
}

function fromIsoDate(iso: string) {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return "";
  return `${m[2]}/${m[3]}/${m[1]}`;
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
  return `${d} ${h12}:${String(mm).padStart(2, "0")} ${ampm}`;
}

type Props = {
  parcelId: number | null;
  open: boolean;
  pickupTypes: string[];
  staffName?: string;
  unitTitle?: string;
  onClose: () => void;
  onDone: () => void;
};

export function ParcelSignoutForm({
  parcelId,
  open,
  pickupTypes,
  staffName = "",
  unitTitle = "",
  onClose,
  onDone,
}: Props) {
  const defaults = useMemo(() => nowParts(), []);
  const [signedOutBy, setSignedOutBy] = useState<SignedOutBy>("Resident");
  const [pickupType, setPickupType] = useState(
    pickupTypes.includes("Quick Signout")
      ? "Quick Signout"
      : pickupTypes[0] || "Quick Signout"
  );
  const [date, setDate] = useState(defaults.date);
  const [time, setTime] = useState(defaults.time);
  const [name, setName] = useState("");
  const [unit, setUnit] = useState(unitTitle);
  const [signature, setSignature] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    const next = nowParts();
    setSignedOutBy("Resident");
    setPickupType(
      pickupTypes.includes("Quick Signout")
        ? "Quick Signout"
        : pickupTypes[0] || "Quick Signout"
    );
    setDate(next.date);
    setTime(next.time);
    setName(staffName);
    setUnit(unitTitle);
    setSignature("");
    setError("");
  }, [open, pickupTypes, staffName, unitTitle]);

  const signoutId = parcelId ?? 0;
  if (!open || signoutId <= 0) return null;

  async function confirm() {
    if (signoutId <= 0) return;
    if (signedOutBy === "Resident" && !signature) {
      setError("Signature is required when signed out by the resident.");
      return;
    }
    if (signedOutBy === "Others" && !name.trim()) {
      setError("Name is required when signed out by others.");
      return;
    }
    setSaving(true);
    setError("");
    const data = await signOutParcel(signoutId, {
      parcel_pickup_type: pickupType,
      signed_out_by: signedOutBy,
      parcel_signedout_on: combineDateTime(date, time),
      parcel_signedout_by_name:
        signedOutBy === "Resident" ? "" : name.trim() || staffName,
      parcel_signedout_by_unit: signedOutBy === "Others" ? unit.trim() : "",
      parcel_signature: signedOutBy === "Resident" ? signature : "",
    });
    setSaving(false);
    if (!data.ok) {
      setError(data.message);
      return;
    }
    onDone();
  }

  return (
    <div
      className="ceo-sheet-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="package-signout-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
    >
      <div className="ceo-sheet ceo-signout-sheet">
        <div className="ceo-sheet__grab">
          <span className="ceo-sheet__handle" />
        </div>
        <h2
          id="package-signout-title"
          className="font-display px-1 text-lg font-semibold"
        >
          Signout Form
        </h2>
        <p className="mb-3 px-1 text-sm text-[var(--muted)]">
          Same fields as the web Signout Form. Mark this package claimed.
        </p>
        <div className="ceo-sheet__body ceo-signout-sheet__body">
          <Input
            label="Signed out on"
            type="date"
            required
            value={toIsoDate(date)}
            onChange={(e) => setDate(fromIsoDate(e.target.value) || date)}
          />
          <Input
            label="Time"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-[var(--muted)]">
              Signed out by
            </span>
            <MenuSelect
              variant="field"
              aria-label="Signed out by"
              value={signedOutBy}
              options={SIGNED_OUT_BY.map((id) => ({ id, label: id }))}
              disabled={saving}
              onChange={(next) => setSignedOutBy(next as SignedOutBy)}
            />
          </label>
          {signedOutBy === "Resident" ? (
            <SignaturePadField
              required
              disabled={saving}
              onChange={setSignature}
            />
          ) : null}
          {signedOutBy === "Others" ? (
            <div className="ceo-form-row">
              <Input
                label="Name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Input
                label="Unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
              />
            </div>
          ) : null}
          {signedOutBy === "Staff" ? (
            <Input
              label="Name"
              value={name || staffName}
              onChange={(e) => setName(e.target.value)}
            />
          ) : null}
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-[var(--muted)]">
              Pickup type
            </span>
            <MenuSelect
              variant="field"
              aria-label="Pickup type"
              value={pickupType}
              options={pickupTypes.map((t) => ({ id: t, label: t }))}
              disabled={saving}
              onChange={setPickupType}
            />
          </label>
          {error ? (
            <p className="rounded-xl bg-[#3a1c1c] px-3 py-2 text-sm text-[var(--danger)]">
              {error}
            </p>
          ) : null}
        </div>
        <div className="ceo-signout-sheet__actions">
          <button
            type="button"
            className="flex-1 rounded-xl border border-[var(--border)] px-3 py-3 text-sm font-semibold"
            disabled={saving}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="ceo-btn-accent flex-1 rounded-xl bg-[var(--accent)] px-3 py-3 text-sm font-semibold text-[#081014] disabled:opacity-60"
            disabled={saving}
            onClick={confirm}
          >
            {saving ? "Signing out…" : "Confirm signout"}
          </button>
        </div>
      </div>
    </div>
  );
}

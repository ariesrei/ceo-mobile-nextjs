"use client";

import { useEffect, useRef, useState } from "react";
import type { ParcelPhoto } from "@/lib/parcels";
import { fileToParcelCapture } from "@/lib/image-jpeg";
import { formatLookupText, parseParcelLabel } from "@/lib/parcel-label";
import {
  detectBarcodeFromImage,
  lookupParcelOcr,
  recognizeParcelLabel,
  scanDeliveredOn,
  warmupParcelOcr,
  type ParcelOcrFill,
  type ParcelOcrPerson,
  type ParcelOcrResult,
} from "@/lib/parcel-ocr";
import { DeviceCameraSheet } from "./DeviceCameraSheet";

type Props = {
  enabled: boolean;
  disabled?: boolean;
  parcelId?: number;
  onPhoto: (photo: ParcelPhoto) => void;
  onFill: (fill: ParcelOcrFill, force?: boolean) => void;
  autoStart?: boolean;
};

function personFill(person: ParcelOcrPerson, unitId?: number, unitTitle?: string): ParcelOcrFill {
  return {
    residentId: person.user_id,
    residentName: person.name,
    unitId: unitId || person.unit_id || 0,
    unitTitle: unitTitle || person.unit_title || "",
  };
}

export function ParcelOcrCapture({
  enabled,
  disabled,
  parcelId,
  onPhoto,
  onFill,
  autoStart,
}: Props) {
  const started = useRef(false);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [result, setResult] = useState<ParcelOcrResult | null>(null);

  useEffect(() => {
    if (enabled) warmupParcelOcr();
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !autoStart || disabled || started.current) return;
    started.current = true;
    setOpen(true);
  }, [autoStart, disabled, enabled]);

  if (!enabled) {
    return null;
  }

  async function uploadPhoto(image: string): Promise<void> {
    const res = await fetch("/api/wp/parcels/media", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image,
        parcel_id: parcelId || 0,
      }),
    });
    const data = (await res.json()) as ParcelPhoto & { message?: string };
    if (!res.ok || !data.id) {
      throw new Error(data.message || "Could not attach the photo.");
    }
    onPhoto({ id: data.id, url: data.url || "" });
  }

  function applyLookup(data: ParcelOcrResult) {
    const parts: string[] = [];

    if (data.name_status === "matched" && data.match) {
      onFill(personFill(data.match), true);
      parts.push(
        [data.match.name, data.match.unit_title ? `Unit ${data.match.unit_title}` : ""]
          .filter(Boolean)
          .join(", ")
      );
    } else if (data.name_status === "resident_only" && data.match) {
      onFill(personFill(data.match), true);
      parts.push(`${data.match.name || "Name matched"}, but no unit is linked`);
    } else if (data.name_status === "choose") {
      parts.push("More than one person or unit matched. Choose one below");
    } else {
      parts.push("No matching resident was found");
    }

    if (data.barcode) {
      onFill({ barcode: data.barcode }, true);
      parts.push(`barcode ${data.barcode}`);
    } else {
      parts.push("no barcode was read");
    }

    if (data.parcel_type?.id) {
      onFill({
        typeId: data.parcel_type.id,
        typeTitle: data.parcel_type.title,
      });
      parts.push(`type ${data.parcel_type.title}`);
    } else if ((data.parcel_types || []).length) {
      parts.push("more than one parcel type matched. Choose one below");
    } else {
      parts.push("no parcel type matched");
    }

    setStatus(`${parts.join(". ")}. Check the form, then save.`);
    setResult(data);
  }

  async function onCaptured(file: File) {
    if (disabled || busy) return;
    if (!file.type.startsWith("image/")) {
      setStatus("Choose a photo of the label.");
      return;
    }

    setBusy(true);
    setResult(null);
    setStatus("Reading the label…");
    onFill({ deliveredOn: scanDeliveredOn() }, true);
    try {
      const capture = await fileToParcelCapture(file);
      const uploadTask = uploadPhoto(capture.upload).catch(() => undefined);
      const scanned = await detectBarcodeFromImage(capture.ocr);
      const labelText = await recognizeParcelLabel(capture.ocr);
      const parsed = parseParcelLabel(labelText);
      const barcode = scanned || parsed.tracking;
      if (barcode) onFill({ barcode }, true);
      if (parsed.carrier) {
        onFill({ typeTitle: parsed.carrier }, true);
      }
      const text = formatLookupText(labelText, parsed);
      if (!text && !barcode) {
        setStatus("No text was read. Fill the frame with the label and hold still.");
        await uploadTask;
        return;
      }
      setStatus("Matching resident and unit…");
      applyLookup(await lookupParcelOcr(text || barcode, barcode));
      await uploadTask;
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Could not read the label.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-[var(--ink)]">Scan</p>
          <p className="text-xs text-[var(--muted)]">
            Fill the frame with the label and hold still.
          </p>
        </div>
        <button
          type="button"
          disabled={disabled || busy}
          onClick={() => setOpen(true)}
          className="shrink-0 rounded-xl bg-[var(--accent)] px-3.5 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {busy ? "Reading…" : "Scan"}
        </button>
      </div>

      <DeviceCameraSheet
        open={open}
        title="Scan package"
        hint="Line up the label, then take the picture."
        onClose={() => setOpen(false)}
        onCapture={onCaptured}
      />

      {status ? (
        <p className="text-sm text-[var(--ink)]" role="status">
          {status}
        </p>
      ) : null}

      {result?.name_status === "choose" && result.candidates?.length ? (
        <div className="flex flex-wrap gap-2">
          {result.candidates.flatMap((person) => {
            const units = person.units?.length
              ? person.units
              : [{ id: 0, title: "" }];
            return units.map((unit) => (
              <button
                key={`${person.user_id}-${unit.id}`}
                type="button"
                className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold text-[var(--ink)]"
                onClick={() => {
                  onFill(personFill(person, unit.id, unit.title), true);
                  setStatus(
                    `Using ${person.name}${unit.title ? ` — Unit ${unit.title}` : ""}. Check the form, then save.`
                  );
                }}
              >
                {person.name}
                {unit.title ? ` — ${unit.title}` : ""}
              </button>
            ));
          })}
        </div>
      ) : null}

      {result?.parcel_types?.length ? (
        <div className="flex flex-wrap gap-2">
          {result.parcel_types.map((type) => (
            <button
              key={type.id}
              type="button"
              className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold text-[var(--ink)]"
              onClick={() => {
                onFill({ typeId: type.id, typeTitle: type.title }, true);
              }}
            >
              Type: {type.title}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

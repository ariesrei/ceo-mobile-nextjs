"use client";

import { useEffect, useRef, useState } from "react";
import type { ParcelPhoto } from "@/lib/parcels";
import { fileToJpegDataUri, fileToOcrImages } from "@/lib/image-jpeg";
import {
  detectBarcodeFromImage,
  lookupParcelOcr,
  recognizeBarcodeText,
  recognizeParcelLabel,
  type ParcelOcrFill,
  type ParcelOcrPerson,
  type ParcelOcrResult,
} from "@/lib/parcel-ocr";

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
  const inputRef = useRef<HTMLInputElement>(null);
  const started = useRef(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [result, setResult] = useState<ParcelOcrResult | null>(null);

  useEffect(() => {
    if (!enabled || !autoStart || disabled || started.current) return;
    started.current = true;
    inputRef.current?.click();
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

    if (data.delivered_on) {
      onFill({ deliveredOn: data.delivered_on });
      parts.push(`delivered ${data.delivered_on}`);
    }

    setStatus(`${parts.join(". ")}. Check the form, then save.`);
    setResult(data);
  }

  async function onFilesSelected(list: FileList | null) {
    const file = list?.[0];
    if (!file || disabled || busy) return;
    if (!file.type.startsWith("image/")) {
      setStatus("Choose a photo of the label.");
      return;
    }

    setBusy(true);
    setResult(null);
    setStatus("Reading the label…");
    try {
      const [uploadImage, ocrImages] = await Promise.all([
        fileToJpegDataUri(file),
        fileToOcrImages(file),
      ]);
      await uploadPhoto(uploadImage);
      setStatus("Reading the label and barcode…");
      const scannedPromise = detectBarcodeFromImage(ocrImages.barcode);
      const labelText = await recognizeParcelLabel(ocrImages.color);
      const barcodeText = await recognizeBarcodeText(ocrImages.barcode);
      const scanned = await scannedPromise;
      const text = [labelText, barcodeText].filter(Boolean).join("\n");
      if (!text) {
        setStatus("No text was read from the photo. Hold the label closer and try again.");
        return;
      }
      setStatus(`Read: ${text.replace(/\s+/g, " ").slice(0, 140)}. Matching the form…`);
      applyLookup(await lookupParcelOcr(text, scanned));
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Could not read the label.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-[var(--ink)]">OCR</p>
          <p className="text-xs text-[var(--muted)]">
            Photograph the label to fill resident, unit, barcode, type, and date.
          </p>
        </div>
        <button
          type="button"
          disabled={disabled || busy}
          onClick={() => inputRef.current?.click()}
          className="shrink-0 rounded-xl bg-[var(--accent)] px-3.5 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {busy ? "Reading…" : "OCR"}
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        disabled={disabled || busy}
        onChange={(e) => onFilesSelected(e.target.files)}
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

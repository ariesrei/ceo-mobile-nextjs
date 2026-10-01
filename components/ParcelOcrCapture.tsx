"use client";

import { useEffect, useRef, useState } from "react";
import type { ParcelPhoto } from "@/lib/parcels";
import { fileToParcelCapture } from "@/lib/image-jpeg";
import { uploadParcelJpeg } from "@/lib/parcel-media";
import {
  extractTracking,
  formatLookupText,
  humanUnitLabel,
  parseParcelLabel,
  pickTracking,
  type ParsedParcelLabel,
} from "@/lib/parcel-label";
import {
  detectBarcodeFromImage,
  lookupParcelOcr,
  recognizeBarcodeText,
  recognizeParcelLabelSources,
  recognizeTrackingLine,
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
  onPhoto: (photo: ParcelPhoto, replaceId?: number) => void;
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
  const fileRef = useRef<HTMLInputElement>(null);
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

  async function uploadPhoto(image: string, replaceId?: number): Promise<void> {
    const uploaded = await uploadParcelJpeg(image, parcelId || 0, {
      replaceLabel: true,
    });
    onPhoto({ id: uploaded.id, url: uploaded.url || image }, replaceId);
  }

  function applyLookup(data: ParcelOcrResult, parsed?: ParsedParcelLabel) {
    const parts: string[] = [];
    const unitLabel = data.match
      ? humanUnitLabel(data.match.unit_id, data.match.unit_title, parsed?.unit)
      : parsed?.unit || "";

    if (data.name_status === "matched" && data.match) {
      onFill(personFill(data.match, data.match.unit_id, unitLabel), true);
      parts.push(
        [data.match.name, unitLabel ? `Unit ${unitLabel}` : ""]
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

    const barcode = pickTracking(parsed?.tracking || "", data.barcode);
    if (barcode) {
      onFill({ barcode }, true);
      parts.push(`barcode ${barcode}`);
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
      const previewId = -Date.now();
      onPhoto({ id: previewId, url: capture.upload });
      let photoError = "";
      const uploadTask = uploadPhoto(capture.upload, previewId).catch((err) => {
        photoError = err instanceof Error ? err.message : "Could not attach the photo.";
      });
      const detectTask = Promise.all([
        detectBarcodeFromImage(capture.ocrColor),
        detectBarcodeFromImage(capture.ocrBand),
      ]);
      const labelText = await recognizeParcelLabelSources(
        capture.ocrColor,
        capture.ocr
      );
      const bandText = await recognizeBarcodeText(capture.ocrBand).catch(() => "");
      const [scannedColor, scannedBand] = await detectTask;
      const parsed = parseParcelLabel(labelText);
      let barcode = pickTracking(
        extractTracking(bandText),
        parsed.tracking,
        scannedColor,
        scannedBand,
        extractTracking(labelText)
      );
      if (!barcode) {
        const lineText = await recognizeTrackingLine(capture.ocrBand).catch(() => "");
        barcode = pickTracking(extractTracking(lineText), extractTracking(`${bandText}\n${lineText}`));
      }
      const parsedWithTrack = { ...parsed, tracking: barcode || parsed.tracking };
      if (barcode) onFill({ barcode }, true);
      if (parsed.carrier) {
        onFill({ typeTitle: parsed.carrier }, true);
      }
      if (parsed.unit) {
        onFill({ unitTitle: parsed.unit }, true);
      }
      const text = formatLookupText(labelText, parsedWithTrack);
      if (!text && !barcode) {
        setStatus("No text was read. Fill the frame with the label and hold still.");
        await uploadTask;
        return;
      }
      setStatus("Matching resident and unit…");
      applyLookup(
        await lookupParcelOcr(text || barcode, barcode.length >= 12 ? barcode : ""),
        parsedWithTrack
      );
      await uploadTask;
      if (photoError) {
        setStatus((current) =>
          current
            ? `${current} Photo did not attach — use Take photo.`
            : photoError
        );
      }
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Could not read the label.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="ceo-pkg-scan"
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
      }}
      onDrop={(e) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file) void onCaptured(file);
      }}
    >
      <div className="ceo-pkg-scan__head">
        <p>Label</p>
        <span>Scan fills the form and attaches the photo.</span>
      </div>
      <button
        type="button"
        disabled={disabled || busy}
        onClick={() => setOpen(true)}
        className="ceo-pkg-scan__go"
      >
        {busy ? "Reading…" : "Scan label"}
      </button>
      <button
        type="button"
        disabled={disabled || busy}
        onClick={() => fileRef.current?.click()}
        className="ceo-pkg-scan__alt"
      >
        Use a saved photo
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void onCaptured(file);
        }}
      />

      <DeviceCameraSheet
        open={open}
        title="Scan label"
        hint="Fill the frame with the label. This photo is saved with the package."
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
                  const label = humanUnitLabel(unit.id, unit.title);
                  onFill(personFill(person, unit.id, label), true);
                  setStatus(
                    `Using ${person.name}${label ? ` — Unit ${label}` : ""}. Check the form, then save.`
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

"use client";

import { useState } from "react";
import { fileToJpegDataUri } from "@/lib/image-jpeg";
import type { ParcelPhoto } from "@/lib/parcels";
import { DeviceCameraSheet } from "./DeviceCameraSheet";

type Props = {
  photos: ParcelPhoto[];
  onChange: (photos: ParcelPhoto[]) => void;
  parcelId?: number;
  disabled?: boolean;
};

export function ParcelCameraPhotos({
  photos,
  onChange,
  parcelId,
  disabled,
}: Props) {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function uploadOne(file: File) {
    const image = await fileToJpegDataUri(file);
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
      throw new Error(data.message || "Upload failed");
    }
    return { id: data.id, url: data.url || "" };
  }

  async function onCaptured(file: File) {
    if (disabled || uploading) return;
    if (!file.type.startsWith("image/")) {
      setError("Choose a photo of the package.");
      return;
    }
    setUploading(true);
    setError("");
    try {
      const uploaded = await uploadOne(file);
      onChange([...photos, uploaded]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not add photo.");
    } finally {
      setUploading(false);
    }
  }

  function removePhoto(id: number) {
    onChange(photos.filter((p) => p.id !== id));
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-[var(--muted)]">
          Photos
        </span>
        <span className="text-xs text-[var(--muted)]">
          {photos.length ? `${photos.length} attached` : "Optional"}
        </span>
      </div>

      {photos.length ? (
        <ul className="grid grid-cols-3 gap-2">
          {photos.map((p) => (
            <li
              key={p.id}
              className="relative aspect-square overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-2)]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.url}
                alt=""
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                disabled={disabled || uploading}
                onClick={() => removePhoto(p.id)}
                className="absolute right-1 top-1 rounded-full bg-black/65 px-2 py-0.5 text-xs font-semibold text-white"
                aria-label="Remove photo"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-2)] px-3 py-4 text-center text-sm text-[var(--muted)]">
          Take a photo to attach it automatically.
        </p>
      )}

      <button
        type="button"
        disabled={disabled || uploading}
        onClick={() => setOpen(true)}
        className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3.5 py-3 text-sm font-semibold text-[var(--ink)] disabled:opacity-60"
      >
        {uploading ? "Adding photo…" : "Take photo"}
      </button>

      <DeviceCameraSheet
        open={open}
        title="Take photo"
        hint="Use the camera, then take the picture."
        onClose={() => setOpen(false)}
        onCapture={onCaptured}
      />

      {error ? (
        <p className="rounded-xl bg-[#3a1c1c] px-3 py-2 text-sm text-[var(--danger)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}

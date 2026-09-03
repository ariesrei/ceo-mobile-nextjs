"use client";

import { useRef, useState } from "react";

export type CameraPhoto = {
  id: number;
  url: string;
};

const MAX_EDGE = 1600;
const JPEG_QUALITY = 0.82;

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read photo"));
    };
    img.src = url;
  });
}

async function fileToJpegDataUri(file: File): Promise<string> {
  let width = 0;
  let height = 0;
  let draw: CanvasImageSource;

  if (typeof createImageBitmap === "function") {
    const bitmap = await createImageBitmap(file);
    width = bitmap.width;
    height = bitmap.height;
    draw = bitmap;
  } else {
    const img = await loadImageFromFile(file);
    width = img.naturalWidth || img.width;
    height = img.naturalHeight || img.height;
    draw = img;
  }

  const scale = Math.min(1, MAX_EDGE / Math.max(width, height));
  const w = Math.max(1, Math.round(width * scale));
  const h = Math.max(1, Math.round(height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    if ("close" in draw && typeof draw.close === "function") draw.close();
    throw new Error("Canvas unavailable");
  }
  ctx.drawImage(draw, 0, 0, w, h);
  if ("close" in draw && typeof draw.close === "function") draw.close();
  return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
}

type Props = {
  photos: CameraPhoto[];
  onChange: (photos: CameraPhoto[]) => void;
  uploadUrl: string;
  parentIdKey?: string;
  parentId?: number;
  disabled?: boolean;
};

export function CameraCapturePhotos({
  photos,
  onChange,
  uploadUrl,
  parentIdKey,
  parentId,
  disabled,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function uploadOne(file: File) {
    const image = await fileToJpegDataUri(file);
    const body: Record<string, unknown> = { image };
    if (parentIdKey && parentId) {
      body[parentIdKey] = parentId;
    }
    const res = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json()) as CameraPhoto & { message?: string };
    if (!res.ok || !data.id) {
      throw new Error(data.message || "Upload failed");
    }
    return { id: data.id, url: data.url || "" };
  }

  async function onFilesSelected(list: FileList | null) {
    if (!list?.length || disabled) return;
    setUploading(true);
    setError("");
    try {
      const next = [...photos];
      for (const file of Array.from(list)) {
        if (!file.type.startsWith("image/")) continue;
        const uploaded = await uploadOne(file);
        next.push(uploaded);
        onChange([...next]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not add photo.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function removePhoto(id: number) {
    onChange(photos.filter((p) => p.id !== id));
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-[var(--muted)]">Photos</span>
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
              <img src={p.url} alt="" className="h-full w-full object-cover" />
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

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        disabled={disabled || uploading}
        onChange={(e) => onFilesSelected(e.target.files)}
      />

      <button
        type="button"
        disabled={disabled || uploading}
        onClick={() => inputRef.current?.click()}
        className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3.5 py-3 text-sm font-semibold text-[var(--ink)] disabled:opacity-60"
      >
        {uploading ? "Adding photo…" : "Take photo"}
      </button>

      {error ? (
        <p className="rounded-xl bg-[#3a1c1c] px-3 py-2 text-sm text-[var(--danger)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";

const MAX_EDGE = 1200;
const JPEG_QUALITY = 0.86;

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

export function ProfileAvatarField({
  avatar,
  initials,
  uploadUrl = "/api/wp/profile/media",
  parentId,
  title = "Profile photo",
  subtitle = "Photo changes are submitted for staff review.",
  immediate = false,
  onPendingChange,
}: {
  avatar?: string;
  initials: string;
  uploadUrl?: string;
  parentId?: number;
  title?: string;
  subtitle?: string;
  immediate?: boolean;
  onPendingChange?: (pending: { id: number; url: string } | null) => void;
}) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const libraryRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState(avatar || "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setPreview(avatar || "");
  }, [avatar]);

  async function uploadFile(file: File) {
    setUploading(true);
    setError("");
    setMessage("");
    try {
      const image = await fileToJpegDataUri(file);
      const res = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image,
          ...(parentId ? { parent_id: parentId, pet_id: parentId } : {}),
        }),
      });
      const data = (await res.json()) as {
        id?: number;
        url?: string;
        message?: string;
      };
      if (!res.ok || !data.id || !data.url) {
        throw new Error(data.message || "Could not upload photo.");
      }
      setPreview(data.url);
      setMessage(
        data.message ||
          (immediate
            ? "Photo saved."
            : "Photo ready. Submit the form for review.")
      );
      onPendingChange?.({ id: data.id, url: data.url });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not upload photo.");
      onPendingChange?.(null);
    } finally {
      setUploading(false);
    }
  }

  async function onFiles(list: FileList | null) {
    const file = list?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    await uploadFile(file);
    if (cameraRef.current) cameraRef.current.value = "";
    if (libraryRef.current) libraryRef.current.value = "";
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col items-center text-center">
        <div className="relative">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt=""
              className="h-24 w-24 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[var(--surface-2)] text-2xl font-bold text-[var(--accent)]">
              {initials}
            </div>
          )}
          <button
            type="button"
            disabled={uploading}
            onClick={() => libraryRef.current?.click()}
            className="absolute -bottom-1 -right-1 rounded-full bg-[var(--accent)] px-2.5 py-1 text-[10px] font-extrabold text-[#081014] disabled:opacity-60"
          >
            {uploading ? "…" : "Edit"}
          </button>
        </div>
        <p className="mt-3 text-sm font-semibold">{title}</p>
        {subtitle ? (
          <p className="text-xs text-[var(--muted)]">{subtitle}</p>
        ) : null}
      </div>

      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="user"
        className="sr-only"
        disabled={uploading}
        onChange={(e) => onFiles(e.target.files)}
      />
      <input
        ref={libraryRef}
        type="file"
        accept="image/*"
        className="sr-only"
        disabled={uploading}
        onChange={(e) => onFiles(e.target.files)}
      />

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={uploading}
          onClick={() => cameraRef.current?.click()}
          className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-3 text-sm font-semibold disabled:opacity-60"
        >
          {uploading ? "Uploading…" : "Take photo"}
        </button>
        <button
          type="button"
          disabled={uploading}
          onClick={() => libraryRef.current?.click()}
          className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-3 text-sm font-semibold disabled:opacity-60"
        >
          Choose photo
        </button>
      </div>

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
    </div>
  );
}

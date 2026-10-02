"use client";

import { useState } from "react";
import { fileToJpegDataUri } from "@/lib/image-jpeg";
import { uploadParcelJpeg } from "@/lib/parcel-media";
import type { ParcelPhoto } from "@/lib/parcels";
import { DeviceCameraSheet } from "./DeviceCameraSheet";
import { ParcelPhotoGallery } from "./ParcelPhotoGallery";

type Props = {
  photos: ParcelPhoto[];
  onChange: (photos: ParcelPhoto[]) => void;
  parcelId?: number;
  disabled?: boolean;
  hideWhenEmpty?: boolean;
};

export function ParcelCameraPhotos({
  photos,
  onChange,
  parcelId,
  disabled,
  hideWhenEmpty,
}: Props) {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const hidden = Boolean(hideWhenEmpty && !photos.length);

  async function onCaptured(file: File) {
    if (disabled || uploading) return;
    if (!file.type.startsWith("image/")) {
      setError("Choose a photo of the package.");
      return;
    }
    setUploading(true);
    setError("");
    try {
      const image = await fileToJpegDataUri(file);
      onChange([...photos, await uploadParcelJpeg(image, parcelId || 0)]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not add photo.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div
      className={`ceo-pkg-photos-edit${hidden ? " ceo-pkg-photos-edit--off" : ""}`}
      hidden={hidden}
    >
      <ParcelPhotoGallery
        photos={photos}
        disabled={disabled}
        adding={uploading}
        onAdd={() => setOpen(true)}
        onRemove={(id) => onChange(photos.filter((photo) => photo.id !== id))}
      />

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

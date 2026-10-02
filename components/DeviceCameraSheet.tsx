"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  frameToJpegFile,
  openRearCamera,
  stopCameraStream,
} from "@/lib/device-camera";

type Props = {
  open: boolean;
  title?: string;
  hint?: string;
  onClose: () => void;
  onCapture: (file: File) => void;
};

export function DeviceCameraSheet({
  open,
  title = "Scan package",
  hint = "Fill the frame with the label. Hold still, then take the picture.",
  onClose,
  onCapture,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    let gone = false;
    const videoEl = videoRef.current;
    setReady(false);
    setError("");

    openRearCamera()
      .then(async (stream) => {
        if (gone) {
          stopCameraStream(stream);
          return;
        }
        streamRef.current = stream;
        const live = videoRef.current || videoEl;
        if (!live) {
          stopCameraStream(stream);
          return;
        }
        live.srcObject = stream;
        await live.play();
        if (!gone) setReady(true);
      })
      .catch(() => {
        if (!gone) {
          setError("Could not open the camera. Check camera permission, then try again.");
        }
      });

    return () => {
      gone = true;
      stopCameraStream(streamRef.current);
      streamRef.current = null;
      if (videoEl) videoEl.srcObject = null;
    };
  }, [open]);

  async function capture() {
    const video = videoRef.current;
    if (!video || !ready) return;
    try {
      const file = await frameToJpegFile(video);
      stopCameraStream(streamRef.current);
      streamRef.current = null;
      onCapture(file);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not take the picture.");
    }
  }

  function onFile(list: FileList | null) {
    const file = list?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    onCapture(file);
    onClose();
  }

  if (!mounted) return null;

  return createPortal(
    <div
      className={open ? "ceo-cam-sheet" : "ceo-cam-sheet ceo-cam-sheet--off"}
      role="dialog"
      aria-modal={open}
      aria-hidden={!open}
      aria-label={title}
      inert={open ? undefined : true}
    >
      <video
        ref={videoRef}
        className="ceo-cam-sheet__video"
        autoPlay
        muted
        playsInline
      />
      <div className="ceo-cam-sheet__top">
        <p>{title}</p>
        <span>{hint}</span>
      </div>
      {error ? <p className="ceo-cam-sheet__error">{error}</p> : null}
      <div className="ceo-cam-sheet__bar">
        <button type="button" className="ceo-cam-sheet__text" onClick={onClose}>
          Cancel
        </button>
        <button
          type="button"
          className="ceo-cam-sheet__shutter"
          disabled={!ready}
          onClick={capture}
          aria-label="Take a picture"
        />
        <button
          type="button"
          className="ceo-cam-sheet__text"
          onClick={() => fileRef.current?.click()}
        >
          Photo
        </button>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => onFile(e.target.files)}
      />
    </div>,
    document.body
  );
}

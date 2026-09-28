"use client";

import { useCallback, useEffect, useRef, type PointerEvent } from "react";

type Props = {
  label?: string;
  required?: boolean;
  disabled?: boolean;
  onChange: (dataUrl: string) => void;
};

export function SignaturePadField({
  label = "Signature",
  required,
  disabled,
  onChange,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const dirty = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);

  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const width = canvas.clientWidth || 320;
    const height = canvas.clientHeight || 160;
    const prev = canvas.toDataURL("image/png");
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, width, height);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#111";
    ctx.lineWidth = 2.2;
    if (dirty.current) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, width, height);
      img.src = prev;
    }
  }, []);

  useEffect(() => {
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [resize]);

  function point(e: PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const box = canvas.getBoundingClientRect();
    return { x: e.clientX - box.left, y: e.clientY - box.top };
  }

  function emit() {
    const canvas = canvasRef.current;
    if (!canvas || !dirty.current) {
      onChange("");
      return;
    }
    onChange(canvas.toDataURL("image/png"));
  }

  function onPointerDown(e: PointerEvent<HTMLCanvasElement>) {
    if (disabled) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    last.current = point(e);
  }

  function onPointerMove(e: PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current || disabled) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const from = last.current;
    if (!ctx || !from) return;
    const to = point(e);
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    last.current = to;
    dirty.current = true;
  }

  function onPointerUp(e: PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    drawing.current = false;
    last.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
    emit();
  }

  function clear() {
    dirty.current = false;
    resize();
    onChange("");
  }

  return (
    <div className="ceo-signature space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-[var(--muted)]">
          {label}
          {required ? " *" : ""}
        </span>
        <button
          type="button"
          className="text-xs font-semibold text-[var(--accent)]"
          disabled={disabled}
          onClick={clear}
        >
          Clear
        </button>
      </div>
      <div className="ceo-signature__pad">
        <canvas
          ref={canvasRef}
          className="ceo-signature__canvas"
          aria-label={label}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        />
      </div>
    </div>
  );
}

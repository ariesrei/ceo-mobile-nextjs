const UPLOAD_MAX_EDGE = 1280;
const OCR_MAX_EDGE = 1400;
const JPEG_QUALITY = 0.78;
const OCR_JPEG_QUALITY = 0.86;

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

async function sourceFromFile(file: File): Promise<{
  width: number;
  height: number;
  draw: CanvasImageSource;
}> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file, {
        imageOrientation: "from-image",
      });
      return {
        width: bitmap.width,
        height: bitmap.height,
        draw: bitmap,
      };
    } catch {
      const bitmap = await createImageBitmap(file);
      return {
        width: bitmap.width,
        height: bitmap.height,
        draw: bitmap,
      };
    }
  }
  const img = await loadImageFromFile(file);
  return {
    width: img.naturalWidth || img.width,
    height: img.naturalHeight || img.height,
    draw: img,
  };
}

function closeSource(draw: CanvasImageSource) {
  if ("close" in draw && typeof draw.close === "function") {
    draw.close();
  }
}

function drawToCanvas(
  draw: CanvasImageSource,
  width: number,
  height: number,
  maxEdge: number,
  enhance = false
): HTMLCanvasElement {
  const scale = Math.min(1, maxEdge / Math.max(width, height));
  const w = Math.max(1, Math.round(width * scale));
  const h = Math.max(1, Math.round(height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas unavailable");
  }
  ctx.drawImage(draw, 0, 0, w, h);
  if (enhance) {
    const pixels = ctx.getImageData(0, 0, w, h);
    const data = pixels.data;
    const contrast = 1.4;
    const intercept = 128 * (1 - contrast);
    for (let i = 0; i < data.length; i += 4) {
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      const value = Math.max(0, Math.min(255, gray * contrast + intercept));
      data[i] = data[i + 1] = data[i + 2] = value;
    }
    ctx.putImageData(pixels, 0, 0);
  }
  return canvas;
}

export async function fileToJpegDataUri(file: File): Promise<string> {
  const { width, height, draw } = await sourceFromFile(file);
  try {
    return drawToCanvas(draw, width, height, UPLOAD_MAX_EDGE).toDataURL(
      "image/jpeg",
      JPEG_QUALITY
    );
  } finally {
    closeSource(draw);
  }
}

export async function fileToOcrImages(file: File): Promise<{
  color: string;
  barcode: string;
}> {
  const capture = await fileToParcelCapture(file);
  return { color: capture.ocr, barcode: capture.ocr };
}

/** Color upload + a plain OCR frame (desktop-style) and a contrast fallback. */
export async function fileToParcelCapture(file: File): Promise<{
  upload: string;
  ocr: string;
  ocrColor: string;
}> {
  const { width, height, draw } = await sourceFromFile(file);
  try {
    const upload = drawToCanvas(draw, width, height, UPLOAD_MAX_EDGE).toDataURL(
      "image/jpeg",
      JPEG_QUALITY
    );
    const ocrColor = drawToCanvas(draw, width, height, OCR_MAX_EDGE).toDataURL(
      "image/jpeg",
      OCR_JPEG_QUALITY
    );
    const ocr = drawToCanvas(draw, width, height, OCR_MAX_EDGE, true).toDataURL(
      "image/jpeg",
      OCR_JPEG_QUALITY
    );
    return { upload, ocr, ocrColor };
  } finally {
    closeSource(draw);
  }
}

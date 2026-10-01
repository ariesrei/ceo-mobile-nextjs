import { parseParcelLabel, pickTracking } from "@/lib/parcel-label";

export type ParcelOcrPerson = {
  user_id: number;
  name: string;
  unit_id?: number;
  unit_title?: string;
  units?: { id: number; title: string }[];
};

export type ParcelOcrType = {
  id: number;
  title: string;
};

export type ParcelOcrResult = {
  barcode: string;
  delivered_on: string;
  parcel_type: ParcelOcrType | null;
  parcel_types: ParcelOcrType[];
  name_status: "matched" | "resident_only" | "choose" | "none" | string;
  match: ParcelOcrPerson | null;
  candidates: ParcelOcrPerson[];
};

export type ParcelOcrFill = {
  unitId?: number;
  unitTitle?: string;
  residentId?: number;
  residentName?: string;
  typeId?: number;
  typeTitle?: string;
  barcode?: string;
  deliveredOn?: string;
};

type TesseractWorker = {
  recognize: (image: string) => Promise<{ data?: { text?: string } }>;
  setParameters?: (params: Record<string, string>) => Promise<void>;
};

const BARCODE_FORMATS = [
  "code_128",
  "code_39",
  "codabar",
  "ean_13",
  "ean_8",
  "upc_a",
  "upc_e",
  "itf",
  "qr_code",
  "data_matrix",
  "pdf417",
  "aztec",
];

type TesseractLib = {
  createWorker: (
    lang: string,
    oem: number,
    opts: {
      workerPath: string;
      corePath: string;
      langPath: string;
      workerBlobURL: boolean;
    }
  ) => Promise<TesseractWorker>;
};

declare global {
  interface Window {
    Tesseract?: TesseractLib;
  }
}

let workerPromise: Promise<TesseractWorker> | null = null;

export function warmupParcelOcr() {
  void getWorker();
}

export function scanDeliveredOn(now = new Date()): string {
  const date = `${String(now.getMonth() + 1).padStart(2, "0")}/${String(now.getDate()).padStart(2, "0")}/${now.getFullYear()}`;
  const hh = now.getHours();
  const mm = String(now.getMinutes()).padStart(2, "0");
  const ampm = hh >= 12 ? "pm" : "am";
  let h12 = hh % 12;
  if (h12 === 0) h12 = 12;
  return `${date} ${h12}:${mm} ${ampm}`;
}

function yieldUi() {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, 0);
  });
}

function loadTesseractScript(): Promise<TesseractLib> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("OCR runs in the browser only."));
  }
  if (window.Tesseract?.createWorker) {
    return Promise.resolve(window.Tesseract);
  }
  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-ceo-tesseract="1"]');
    if (existing) {
      existing.addEventListener("load", () => {
        if (window.Tesseract?.createWorker) resolve(window.Tesseract);
        else reject(new Error("tesseract"));
      });
      existing.addEventListener("error", () => reject(new Error("tesseract")));
      return;
    }
    const script = document.createElement("script");
    script.src = "/tesseract/tesseract.min.js";
    script.async = true;
    script.setAttribute("data-ceo-tesseract", "1");
    script.onload = () => {
      if (window.Tesseract?.createWorker) resolve(window.Tesseract);
      else reject(new Error("tesseract"));
    };
    script.onerror = () => reject(new Error("tesseract"));
    document.head.appendChild(script);
  });
}

function getWorker(): Promise<TesseractWorker> {
  if (!workerPromise) {
    workerPromise = loadTesseractScript()
      .then((Tesseract) =>
        Tesseract.createWorker("eng", 1, {
          workerPath: "/tesseract/worker.min.js",
          corePath: "/tesseract/tesseract-core-lstm.wasm.js",
          langPath: "/tesseract",
          workerBlobURL: false,
        })
      )
      .catch((err) => {
        workerPromise = null;
        throw err;
      });
  }
  return workerPromise;
}

async function recognizeWithParams(
  image: string,
  params?: Record<string, string>
): Promise<string> {
  try {
    const worker = await getWorker();
    if (params && typeof worker.setParameters === "function") {
      await worker.setParameters(params);
    }
    await yieldUi();
    const result = await worker.recognize(image);
    return String(result?.data?.text || "").trim();
  } catch (err) {
    workerPromise = null;
    throw err;
  }
}

export async function recognizeParcelLabel(image: string): Promise<string> {
  // PSM 3 matches desktop parcel-ocr.js (two-column DHL labels).
  return recognizeWithParams(image, {
    tessedit_pageseg_mode: "3",
    preserve_interword_spaces: "1",
  });
}

/** Color first (desktop), then contrast if the ship-to name is still missing. */
export async function recognizeParcelLabelSources(
  color: string,
  enhanced?: string
): Promise<string> {
  const first = await recognizeParcelLabel(color);
  if (!enhanced || parseParcelLabel(first).name) {
    return first;
  }
  const second = await recognizeWithParams(enhanced, {
    tessedit_pageseg_mode: "6",
    preserve_interword_spaces: "1",
  }).catch(() => "");
  return [first, second].filter(Boolean).join("\n");
}

export async function recognizeBarcodeText(image: string): Promise<string> {
  return recognizeWithParams(image, {
    tessedit_pageseg_mode: "6",
    preserve_interword_spaces: "1",
    tessedit_char_whitelist: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ- ",
  });
}

export async function recognizeTrackingLine(image: string): Promise<string> {
  return recognizeWithParams(image, {
    tessedit_pageseg_mode: "7",
    preserve_interword_spaces: "1",
    tessedit_char_whitelist: "0123456789TRACKINGUMBER- ",
  });
}

export async function detectBarcodeFromImage(image: string): Promise<string> {
  const Detector = (
    window as Window & {
      BarcodeDetector?: new (opts?: { formats?: string[] }) => {
        detect: (source: ImageBitmap) => Promise<Array<{ rawValue?: string }>>;
      };
    }
  ).BarcodeDetector;
  if (!Detector) return "";
  try {
    const res = await fetch(image);
    const blob = await res.blob();
    const bitmap = await createImageBitmap(blob);
    const detector = new Detector({ formats: BARCODE_FORMATS });
    const codes = await detector.detect(bitmap);
    if ("close" in bitmap && typeof bitmap.close === "function") {
      bitmap.close();
    }
    const values = (codes || []).map((code) =>
      String(code.rawValue || "")
        .replace(/[^A-Za-z0-9]/g, "")
        .toUpperCase()
    );
    return pickTracking(...values);
  } catch {
    return "";
  }
}

export async function lookupParcelOcr(
  text: string,
  barcode = ""
): Promise<ParcelOcrResult> {
  const res = await fetch("/api/wp/parcels/ocr", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, barcode }),
  });
  const data = (await res.json()) as ParcelOcrResult & { message?: string };
  if (!res.ok) {
    throw new Error(data.message || "Could not match the label.");
  }
  return data;
}

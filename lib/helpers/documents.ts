import { apiGet } from "./api";
import { asArray, asNumber, asRecord, asString, readListPayload } from "./validate";

export type DocumentCategory = "building" | "unit" | "forms" | string;

export type DocumentFolder = {
  id: number;
  title: string;
  count: number;
  category: DocumentCategory;
};

export type DocumentFile = {
  id: number;
  title: string;
  size: string;
  url: string;
};

function decodeTitle(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'");
}

export function toDocumentFolder(raw: unknown): DocumentFolder | null {
  const row = asRecord(raw);
  const id = asNumber(row?.id);
  if (!row || id <= 0) return null;
  return {
    id,
    title: decodeTitle(asString(row.title)),
    count: asNumber(row.count),
    category: asString(row.category).toLowerCase() || "building",
  };
}

export function toDocumentFile(raw: unknown): DocumentFile | null {
  const row = asRecord(raw);
  const id = asNumber(row?.id);
  if (!row || id <= 0) return null;
  return {
    id,
    title: decodeTitle(asString(row.title)),
    size: asString(row.size),
    url: asString(row.url),
  };
}

export async function listDocumentFolders() {
  const res = await apiGet("/api/wp/documents");
  if (!res.ok) return { ok: false as const, items: [] as DocumentFolder[] };
  const payload = readListPayload(res.data);
  const items = payload.items
    .map(toDocumentFolder)
    .filter((item): item is DocumentFolder => Boolean(item));
  return { ok: true as const, items };
}

export async function listDocumentFiles(folderId: number) {
  const res = await apiGet(`/api/wp/documents/${folderId}`);
  if (!res.ok) {
    return { ok: false as const, title: "", items: [] as DocumentFile[] };
  }
  const data = asRecord(res.data) || {};
  const items = asArray(data.items)
    .map(toDocumentFile)
    .filter((item): item is DocumentFile => Boolean(item));
  return { ok: true as const, title: asString(data.title), items };
}

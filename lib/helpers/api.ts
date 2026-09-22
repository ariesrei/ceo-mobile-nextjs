import {
  AppError,
  errorFromStatus,
  formatAppError,
  networkError,
} from "./errors";
import { asRecord, readActionMessage } from "./validate";

export type ApiOk<T> = { ok: true; data: T };
export type ApiFail = { ok: false; error: AppError; message: string };
export type ApiResult<T> = ApiOk<T> | ApiFail;

function fail(error: AppError): ApiFail {
  return { ok: false, error, message: formatAppError(error) };
}

async function parseBody(res: Response): Promise<unknown> {
  return res.json().catch(() => ({}));
}

export async function apiGet(path: string): Promise<ApiResult<unknown>> {
  try {
    const res = await fetch(path);
    const data = await parseBody(res);
    if (!res.ok) {
      return fail(
        errorFromStatus(res.status, readActionMessage(data, ""))
      );
    }
    return { ok: true, data };
  } catch {
    return fail(networkError());
  }
}

export async function apiPost(
  path: string,
  body: unknown = {}
): Promise<ApiResult<unknown>> {
  try {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body ?? {}),
    });
    const data = await parseBody(res);
    if (!res.ok) {
      return fail(
        errorFromStatus(res.status, readActionMessage(data, ""))
      );
    }
    return { ok: true, data: asRecord(data) || data };
  } catch {
    return fail(networkError());
  }
}

export function queryString(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") continue;
    search.set(key, String(value));
  }
  return search.toString();
}

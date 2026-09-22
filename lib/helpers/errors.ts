export const AppErrorName = {
  Network: "NETWORK",
  Validation: "VALIDATION",
  BadRequest: "BAD_REQUEST",
  Unauthorized: "UNAUTHORIZED",
  Forbidden: "FORBIDDEN",
  NotFound: "NOT_FOUND",
  Conflict: "CONFLICT",
  Server: "SERVER",
  Unknown: "UNKNOWN",
} as const;

export type AppErrorName = (typeof AppErrorName)[keyof typeof AppErrorName];

const STATUS_BY_NAME: Record<AppErrorName, number> = {
  NETWORK: 0,
  VALIDATION: 422,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  SERVER: 500,
  UNKNOWN: 500,
};

const LABEL_BY_NAME: Record<AppErrorName, string> = {
  NETWORK: "Network Error",
  VALIDATION: "422 Validation Error",
  BAD_REQUEST: "400 Bad Request",
  UNAUTHORIZED: "401 Unauthorized",
  FORBIDDEN: "403 Forbidden",
  NOT_FOUND: "404 Not Found",
  CONFLICT: "409 Conflict",
  SERVER: "500 Server Error",
  UNKNOWN: "Error",
};

export class AppError extends Error {
  readonly name: AppErrorName;
  readonly status: number;
  readonly label: string;

  constructor(name: AppErrorName, message = "", status?: number) {
    const label = LABEL_BY_NAME[name];
    super(message || label);
    this.name = name;
    this.status = status ?? STATUS_BY_NAME[name];
    this.label = label;
  }
}

export function nameFromStatus(status: number): AppErrorName {
  if (status === 400) return AppErrorName.BadRequest;
  if (status === 401) return AppErrorName.Unauthorized;
  if (status === 403) return AppErrorName.Forbidden;
  if (status === 404) return AppErrorName.NotFound;
  if (status === 409) return AppErrorName.Conflict;
  if (status === 422) return AppErrorName.Validation;
  if (status >= 500) return AppErrorName.Server;
  if (status <= 0) return AppErrorName.Network;
  return AppErrorName.Unknown;
}

export function errorFromStatus(status: number, message = ""): AppError {
  return new AppError(nameFromStatus(status), message, status);
}

export function networkError(message = "Network error."): AppError {
  return new AppError(AppErrorName.Network, message, 0);
}

export function validationError(message: string): AppError {
  return new AppError(AppErrorName.Validation, message);
}

export function notFoundError(message = ""): AppError {
  return new AppError(AppErrorName.NotFound, message);
}

/** "404 Not Found" or "404 Not Found · Guest not found" */
export function formatAppError(error: AppError): string {
  const detail = error.message.trim();
  if (!detail || detail === error.label) return error.label;
  return `${error.label} · ${detail}`;
}

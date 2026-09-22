export type ConnectVerifyResult = {
  valid?: boolean;
  message?: string;
  code?: string;
  client_name?: string;
  client_logo?: string;
  client_hero?: string;
  client_tagline?: string;
  plan_key?: string;
  app_profile?: string;
};

export function verifyConnectUrl(baseUrl: string): string {
  return `${baseUrl.replace(/\/+$/, "")}/wp-json/onesource/v1/mobile/verify-connect`;
}

export function parseConnectVerifyBody(rawBody: string): ConnectVerifyResult {
  try {
    return JSON.parse(rawBody) as ConnectVerifyResult;
  } catch {
    return {};
  }
}

export function connectVerifyErrorMessage(
  status: number,
  rawBody: string,
  data: ConnectVerifyResult
): string {
  if (data.message) return withMobileKeyHint(data.message);
  if (/<!DOCTYPE|<html/i.test(rawBody)) {
    return `Could not reach this property’s connect API (HTTP ${status}). The site blocked the request.`;
  }
  if (status === 404) {
    return "This property URL has no mobile connect API. Include the site path (example: https://demo.ceonesource.com/pacificvista).";
  }
  return withMobileKeyHint(
    "Invalid security key for this property."
  );
}

function withMobileKeyHint(message: string): string {
  if (!/invalid security key/i.test(message) || /Mobile App/i.test(message)) {
    return message;
  }
  return `${message} Copy the Mobile App Secret Key from Options → Mobile App, then Save. A generated key does not work until you save. Desktop key will not work.`;
}

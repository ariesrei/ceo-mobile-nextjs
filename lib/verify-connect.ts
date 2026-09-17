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
  if (data.message) return data.message;
  if (/<!DOCTYPE|<html/i.test(rawBody)) {
    return `Could not reach this property’s connect API (HTTP ${status}). The site blocked the request.`;
  }
  if (status === 404) {
    return "This property URL has no mobile connect API. Include the site path (example: https://demo.ceonesource.com/pacificvista).";
  }
  return "Invalid security key for this property. Copy the Mobile App Secret Key from that property’s Options → Mobile App tab, then save.";
}

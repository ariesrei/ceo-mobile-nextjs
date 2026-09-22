import { type AppProfile } from "./app-profile";

export const PRIVACY_POLICY_URL =
  "https://www.ceonesource.com/privacy-policy/";
export const TERMS_URL = "https://www.ceonesource.com/terms-and-conditions/";
export const SUPPORT_URL = "https://www.ceonesource.com/";

export const OPERATIONS_PLAY_STORE_ID = "com.ceonesource.residentnext";
export const WARRANTY_PLAY_STORE_ID = "com.ceonesource.warranty";

export const PLAY_STORE_ID = OPERATIONS_PLAY_STORE_ID;

type StoreSet = {
  playUrl: string;
  iosUrl: string;
  playLive: boolean;
  iosLive: boolean;
  playId: string;
};

function storeSet(
  playEnv: string | undefined,
  iosEnv: string | undefined,
  fallbackPlayId: string
): StoreSet {
  const playUrl = playEnv?.trim() || "";
  const iosUrl = iosEnv?.trim() || "";
  return {
    playUrl: playUrl || `https://play.google.com/store/apps/details?id=${fallbackPlayId}`,
    iosUrl,
    playLive: Boolean(playUrl),
    iosLive: Boolean(iosUrl),
    playId: fallbackPlayId,
  };
}

export function storeLinksForProfile(profile: AppProfile | null | undefined): StoreSet {
  if (profile === "warranty") {
    return storeSet(
      process.env.NEXT_PUBLIC_WARRANTY_PLAY_STORE_URL,
      process.env.NEXT_PUBLIC_WARRANTY_APP_STORE_URL,
      WARRANTY_PLAY_STORE_ID
    );
  }
  return storeSet(
    process.env.NEXT_PUBLIC_OPERATIONS_PLAY_STORE_URL ||
      process.env.NEXT_PUBLIC_PLAY_STORE_URL,
    process.env.NEXT_PUBLIC_OPERATIONS_APP_STORE_URL ||
      process.env.NEXT_PUBLIC_APP_STORE_URL,
    OPERATIONS_PLAY_STORE_ID
  );
}

export const PLAY_STORE_URL = storeLinksForProfile("operations").playUrl;
export const APP_STORE_URL = storeLinksForProfile("operations").iosUrl;

export function isPlayStoreLive(profile?: AppProfile | null): boolean {
  return storeLinksForProfile(profile || "warranty").playLive;
}

export function isAppStoreLive(profile?: AppProfile | null): boolean {
  return storeLinksForProfile(profile || "warranty").iosLive;
}

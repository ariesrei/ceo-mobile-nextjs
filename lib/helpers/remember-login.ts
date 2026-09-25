const USER_KEY = "ceo_remember_username";
const FLAG_KEY = "ceo_remember_login";

type SavedLogin = {
  username: string;
  password: string;
  enabled: boolean;
};

function canUseStore(): boolean {
  return typeof window !== "undefined";
}

function passwordCredentialApi() {
  if (!canUseStore()) return null;
  const ctor = (
    window as Window & {
      PasswordCredential?: new (data: {
        id: string;
        password: string;
      }) => Credential;
    }
  ).PasswordCredential;
  if (!ctor || !navigator.credentials?.store || !navigator.credentials.get) {
    return null;
  }
  return ctor;
}

export function rememberLoginEnabled(): boolean {
  if (!canUseStore()) return false;
  try {
    return window.localStorage.getItem(FLAG_KEY) === "1";
  } catch {
    return false;
  }
}

export function readRememberedUsername(): string {
  if (!canUseStore() || !rememberLoginEnabled()) return "";
  try {
    return window.localStorage.getItem(USER_KEY) || "";
  } catch {
    return "";
  }
}

export async function readRememberedLogin(): Promise<SavedLogin> {
  const enabled = rememberLoginEnabled();
  const username = readRememberedUsername();
  if (!enabled) {
    return { username: "", password: "", enabled: false };
  }

  const Ctor = passwordCredentialApi();
  if (Ctor) {
    try {
      const cred = (await navigator.credentials.get({
        password: true,
        mediation: "optional",
      } as CredentialRequestOptions)) as {
        id?: string;
        password?: string;
      } | null;
      if (cred?.id) {
        return {
          username: cred.id,
          password: cred.password || "",
          enabled: true,
        };
      }
    } catch {
      /* user declined or the store is empty */
    }
  }

  return { username, password: "", enabled: true };
}

export async function saveRememberedLogin(username: string, password: string) {
  if (!canUseStore()) return;
  const id = username.trim();
  try {
    window.localStorage.setItem(FLAG_KEY, "1");
    window.localStorage.setItem(USER_KEY, id);
  } catch {
    /* private mode */
  }

  const Ctor = passwordCredentialApi();
  if (!Ctor || !id || !password) return;
  try {
    await navigator.credentials.store(new Ctor({ id, password }));
  } catch {
    /* browser declined to store */
  }
}

export function clearRememberedLogin() {
  if (!canUseStore()) return;
  try {
    window.localStorage.removeItem(FLAG_KEY);
    window.localStorage.removeItem(USER_KEY);
  } catch {
    /* private mode */
  }
  if (navigator.credentials?.preventSilentAccess) {
    void navigator.credentials.preventSilentAccess();
  }
}

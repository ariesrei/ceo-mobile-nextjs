export const WARRANTY_SETTINGS_KEY = "ceo_warranty_settings_v1";

export type WarrantySettingsState = {
  claimUpdates: boolean;
  subcontractorUpdates: boolean;
  dailySummary: boolean;
  defaultStatus: string;
  defaultAssignee: string;
};

export const DEFAULT_WARRANTY_SETTINGS: WarrantySettingsState = {
  claimUpdates: true,
  subcontractorUpdates: true,
  dailySummary: false,
  defaultStatus: "",
  defaultAssignee: "",
};

export function readWarrantySettings(): WarrantySettingsState {
  if (typeof window === "undefined") return DEFAULT_WARRANTY_SETTINGS;
  try {
    const raw = localStorage.getItem(WARRANTY_SETTINGS_KEY);
    if (!raw) return DEFAULT_WARRANTY_SETTINGS;
    return {
      ...DEFAULT_WARRANTY_SETTINGS,
      ...(JSON.parse(raw) as Partial<WarrantySettingsState>),
    };
  } catch {
    return DEFAULT_WARRANTY_SETTINGS;
  }
}

export function writeWarrantySettings(
  next: WarrantySettingsState
): WarrantySettingsState {
  try {
    localStorage.setItem(WARRANTY_SETTINGS_KEY, JSON.stringify(next));
  } catch {
    /* private mode */
  }
  return next;
}

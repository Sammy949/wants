import { isCurrencyCode, type CurrencyCode } from "@/lib/money";

export type ThemePreference = "system" | "light" | "dark";

export interface Preferences {
  theme: ThemePreference;
  /** Currency new wants start with. Null means "the last one you used". */
  currency: CurrencyCode | null;
}

export const PREF_KEYS = { theme: "pref.theme", currency: "pref.currency" } as const;

export const DEFAULT_PREFERENCES: Preferences = { theme: "system", currency: null };

/** Parse stored strings defensively: anything unknown falls back to the default. */
export function parsePreferences(raw: { theme: string | null; currency: string | null }): Preferences {
  const theme: ThemePreference =
    raw.theme === "light" || raw.theme === "dark" || raw.theme === "system" ? raw.theme : "system";
  const currency = raw.currency && isCurrencyCode(raw.currency) ? raw.currency : null;
  return { theme, currency };
}

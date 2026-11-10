import Storage from "expo-sqlite/kv-store";
import { createContext, useContext, useMemo, useState, type PropsWithChildren } from "react";
import { Appearance } from "react-native";
import type { CurrencyCode } from "@/lib/money";
import { parsePreferences, PREF_KEYS, type Preferences, type ThemePreference } from "./preferences-core";

function applyTheme(theme: ThemePreference) {
  // Overrides the app's appearance for native UI too (keyboard, pickers, alerts).
  Appearance.setColorScheme(theme === "system" ? "unspecified" : theme);
}

function readStored(): Preferences {
  try {
    return parsePreferences({
      theme: Storage.getItemSync(PREF_KEYS.theme),
      currency: Storage.getItemSync(PREF_KEYS.currency),
    });
  } catch {
    return parsePreferences({ theme: null, currency: null });
  }
}

interface PreferencesContextValue extends Preferences {
  setTheme: (theme: ThemePreference) => void;
  setCurrency: (currency: CurrencyCode | null) => void;
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

/**
 * Read synchronously on first render so a forced light/dark theme is applied
 * before anything paints, with no flash of the system theme.
 */
export function PreferencesProvider({ children }: PropsWithChildren) {
  const [prefs, setPrefs] = useState<Preferences>(() => {
    const stored = readStored();
    applyTheme(stored.theme);
    return stored;
  });

  const value = useMemo<PreferencesContextValue>(
    () => ({
      ...prefs,
      setTheme(theme) {
        applyTheme(theme);
        try {
          Storage.setItemSync(PREF_KEYS.theme, theme);
        } catch {}
        setPrefs((p) => ({ ...p, theme }));
      },
      setCurrency(currency) {
        try {
          if (currency) Storage.setItemSync(PREF_KEYS.currency, currency);
          else Storage.removeItemSync(PREF_KEYS.currency);
        } catch {}
        setPrefs((p) => ({ ...p, currency }));
      },
    }),
    [prefs],
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences(): PreferencesContextValue {
  const value = useContext(PreferencesContext);
  if (!value) throw new Error("usePreferences must be used inside PreferencesProvider");
  return value;
}

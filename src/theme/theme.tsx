import * as SystemUI from "expo-system-ui";
import { createContext, useContext, useEffect, useMemo, type PropsWithChildren } from "react";
import { useColorScheme } from "react-native";
import { palettes, type Palette } from "./tokens";

export type Scheme = "light" | "dark";

interface Theme {
  scheme: Scheme;
  colors: Palette;
}

const ThemeContext = createContext<Theme>({ scheme: "light", colors: palettes.light });

/**
 * Follows the system appearance. A manual override can come later from Settings;
 * there is deliberately no in-app sun/moon toggle.
 */
export function ThemeProvider({ children }: PropsWithChildren) {
  const system = useColorScheme();
  const scheme: Scheme = system === "dark" ? "dark" : "light";
  const value = useMemo(() => ({ scheme, colors: palettes[scheme] }), [scheme]);

  useEffect(() => {
    // Root view colour shows during transitions and keyboard animations.
    SystemUI.setBackgroundColorAsync(value.colors.bg).catch(() => {});
  }, [value.colors.bg]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}

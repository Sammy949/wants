import { DataProvider } from "@/data/provider";
import { ThemeProvider, useTheme } from "@/theme/theme";
import {
  Sora_400Regular,
  Sora_500Medium,
  Sora_600SemiBold,
  Sora_700Bold,
  useFonts,
} from "@expo-google-fonts/sora";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";

SplashScreen.preventAutoHideAsync().catch(() => {});

function AppStack() {
  const { scheme, colors } = useTheme();
  return (
    <>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }} />
    </>
  );
}

export default function RootLayout() {
  // Expo Go can't use the expo-font config plugin (needs a native build), so fonts load at runtime.
  const [loaded, error] = useFonts({ Sora_400Regular, Sora_500Medium, Sora_600SemiBold, Sora_700Bold });

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync().catch(() => {});
  }, [loaded, error]);

  // On a font error, render anyway: text falls back to the system font rather than a blank app.
  if (!loaded && !error) return null;

  return (
    <ThemeProvider>
      <DataProvider>
        <AppStack />
      </DataProvider>
    </ThemeProvider>
  );
}

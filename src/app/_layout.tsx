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
  // Native bottom sheet on both platforms: system drag, detents and dismiss.
  // Sheet screens must use a ScrollView as their root on iOS (see WantForm).
  const SHEET = {
    presentation: "formSheet" as const,
    sheetAllowedDetents: [0.7, 0.95],
    sheetGrabberVisible: true,
    sheetCornerRadius: 24,
    contentStyle: { backgroundColor: colors.bg },
  };
  return (
    <>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="want/new" options={SHEET} />
        <Stack.Screen name="want/[id]" />
        <Stack.Screen name="want/edit/[id]" options={SHEET} />
      </Stack>
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

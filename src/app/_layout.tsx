import { DataProvider } from "@/data/provider";
import { PreferencesProvider } from "@/data/preferences";
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
import { GestureHandlerRootView } from "react-native-gesture-handler";

SplashScreen.preventAutoHideAsync().catch(() => {});

function AppStack() {
  const { scheme, colors } = useTheme();
  // Native bottom sheet on both platforms: system drag, detents and dismiss.
  // iOS rule: a scrolling sheet must have its ScrollView as the root (WantForm);
  // a content-sized sheet uses a plain View root (NewWantFlow).
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
        {/* New want sizes to each step; Edit keeps fixed heights for its longer form. */}
        <Stack.Screen name="want/new" options={{ ...SHEET, sheetAllowedDetents: "fitToContents" }} />
        <Stack.Screen name="want/[id]" />
        <Stack.Screen name="want/edit/[id]" options={SHEET} />
        <Stack.Screen name="settings" />
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
    // Gesture Handler needs a root view for swipe actions on list rows.
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PreferencesProvider>
        <ThemeProvider>
          <DataProvider>
            <AppStack />
          </DataProvider>
        </ThemeProvider>
      </PreferencesProvider>
    </GestureHandlerRootView>
  );
}

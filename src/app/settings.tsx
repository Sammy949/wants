import Constants from "expo-constants";
import { router } from "expo-router";
import { CaretLeftIcon } from "phosphor-react-native/src/icons/CaretLeft";
import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, IconButton } from "@/components/button";
import { CurrencyList } from "@/components/currency-select";
import { Disclosure } from "@/components/disclosure";
import { Segmented } from "@/components/segmented";
import { Text } from "@/components/text";
import { usePreferences } from "@/data/preferences";
import type { ThemePreference } from "@/data/preferences-core";
import { CURRENCY_INFO } from "@/lib/money";
import { useTheme } from "@/theme/theme";
import { gutter, space } from "@/theme/tokens";

const THEMES: { value: ThemePreference; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

export default function SettingsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const prefs = usePreferences();
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const version = Constants.expoConfig?.version;
  const currencySummary = prefs.currency
    ? `${CURRENCY_INFO[prefs.currency].symbol} ${prefs.currency}`
    : "Last used";

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={[styles.bar, { paddingTop: insets.top + space.xs }]}>
        <IconButton icon={CaretLeftIcon} accessibilityLabel="Back" onPress={() => router.back()} />
      </View>
      <ScrollView contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + space.xxxl }]}>
        <Text variant="display" accessibilityRole="header">
          Settings
        </Text>

        <View style={styles.section}>
          <Text variant="label">Appearance</Text>
          <Segmented options={THEMES} value={prefs.theme} onChange={prefs.setTheme} accessibilityLabel="Appearance" />
        </View>

        <View style={styles.section}>
          <Disclosure
            label="Default currency"
            summary={currencySummary}
            filled={!!prefs.currency}
            open={currencyOpen}
            onToggle={() => setCurrencyOpen((o) => !o)}
          >
            <Text variant="meta">New wants start with this. Leave it on Last used to follow your latest want.</Text>
            <CurrencyList
              value={prefs.currency ?? undefined}
              onSelect={(code) => {
                prefs.setCurrency(code);
                setCurrencyOpen(false);
              }}
            />
            {prefs.currency ? (
              <Button
                label="Use the last one I used instead"
                variant="plain"
                onPress={() => {
                  prefs.setCurrency(null);
                  setCurrencyOpen(false);
                }}
              />
            ) : null}
          </Disclosure>
        </View>

        {version ? (
          <Text variant="meta" style={styles.version}>
            wants {version}
          </Text>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { paddingHorizontal: space.sm },
  body: { paddingHorizontal: gutter, paddingTop: space.sm, gap: space.xxl },
  section: { gap: space.sm },
  version: { textAlign: "center", marginTop: space.xl },
});

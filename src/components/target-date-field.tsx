import NativeDatePicker from "@expo/ui/community/datetime-picker";
import { CalendarBlankIcon } from "phosphor-react-native/src/icons/CalendarBlank";
import { useState } from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import { formatTargetDate, fromIsoDate, toIsoDate } from "@/lib/dates";
import { useTheme } from "@/theme/theme";
import { minTouch, radius, space } from "@/theme/tokens";
import { Button } from "./button";
import { Icon } from "./icon";
import { Text } from "./text";

interface TargetDateFieldProps {
  /** Stored calendar day, YYYY-MM-DD. */
  value: string;
  onChange: (isoDate: string) => void;
  onRemove: () => void;
  fill?: "bg" | "surface";
}

/**
 * The date you're aiming for. iOS shows the native compact picker (a date chip
 * that opens Apple's calendar). Android shows our chip and opens the Material
 * date dialog on tap. Dates before today can't be picked.
 */
export function TargetDateField({ value, onChange, onRemove, fill = "bg" }: TargetDateFieldProps) {
  const { colors, scheme } = useTheme();
  const [dialogOpen, setDialogOpen] = useState(false);
  const today = new Date();
  const date = fromIsoDate(value);

  return (
    <View style={styles.row}>
      {Platform.OS === "ios" ? (
        <NativeDatePicker
          value={date}
          mode="date"
          display="compact"
          minimumDate={today}
          accentColor={colors.accent}
          themeVariant={scheme}
          onValueChange={(_e, picked) => onChange(toIsoDate(picked))}
        />
      ) : (
        <Pressable
          onPress={() => setDialogOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={`Target date, ${formatTargetDate(value)}. Change`}
          style={({ pressed }) => [
            styles.chip,
            { backgroundColor: colors[fill] },
            pressed && { backgroundColor: colors.press },
          ]}
        >
          <Icon icon={CalendarBlankIcon} size={18} color="muted" />
          <Text variant="body">{date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}</Text>
        </Pressable>
      )}
      {dialogOpen ? (
        <NativeDatePicker
          value={date}
          mode="date"
          presentation="dialog"
          minimumDate={today}
          accentColor={colors.accent}
          onValueChange={(_e, picked) => {
            setDialogOpen(false);
            onChange(toIsoDate(picked));
          }}
          onDismiss={() => setDialogOpen(false)}
        />
      ) : null}
      <Button label="Remove" variant="plain" onPress={onRemove} />
    </View>
  );
}

/** A sensible starting point when someone adds a date: a month from today. */
export function defaultTargetDate(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return toIsoDate(d);
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: space.sm },
  chip: {
    minHeight: minTouch,
    paddingHorizontal: space.md,
    borderRadius: radius.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
  },
});

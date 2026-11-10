import { useEffect } from "react";
import { AccessibilityInfo, Pressable, StyleSheet, View } from "react-native";
import { useTheme } from "@/theme/theme";
import { gutter, minTouch, radius, space } from "@/theme/tokens";
import { Text } from "./text";

interface UndoBarProps {
  message: string;
  onUndo: () => void;
}

/** "Deleted X · Undo", shown while a deletion can still be taken back. */
export function UndoBar({ message, onUndo }: UndoBarProps) {
  const { colors } = useTheme();

  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(`${message}. Undo available.`);
  }, [message]);

  return (
    <View style={styles.wrap}>
      <View style={[styles.bar, { backgroundColor: colors.ink }]} accessibilityLiveRegion="polite">
        <Text variant="body" numberOfLines={1} style={[styles.message, { color: colors.bg }]}>
          {message}
        </Text>
        <Pressable
          onPress={onUndo}
          accessibilityRole="button"
          accessibilityLabel="Undo delete"
          hitSlop={6}
          style={({ pressed }) => [styles.undo, pressed && { opacity: 0.7 }]}
        >
          <Text variant="label" style={{ color: colors.bg }}>
            Undo
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: gutter, paddingTop: space.sm },
  bar: {
    minHeight: minTouch,
    borderRadius: radius.md,
    paddingLeft: space.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
  },
  message: { flex: 1 },
  undo: { minHeight: minTouch, paddingHorizontal: space.lg, justifyContent: "center" },
});

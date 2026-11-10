import { CaretDownIcon } from "phosphor-react-native/src/icons/CaretDown";
import type { PropsWithChildren } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, { LinearTransition, useAnimatedStyle, withTiming } from "react-native-reanimated";
import { useTheme } from "@/theme/theme";
import { minTouch, radius, space } from "@/theme/tokens";
import { Icon } from "./icon";
import { Text } from "./text";

interface DisclosureProps extends PropsWithChildren {
  label: string;
  /** Shown on the right when closed: the current value, or a prompt like "Add". */
  summary: string;
  /** True when summary is a real value rather than a prompt. */
  filled?: boolean;
  open: boolean;
  onToggle: () => void;
}

const LAYOUT = LinearTransition.duration(220);

/**
 * A collapsed optional field. The row stays put; the body appears under it and
 * the rows below slide to make room. Content is never faded in from invisible.
 */
export function Disclosure({ label, summary, filled, open, onToggle, children }: DisclosureProps) {
  const { colors } = useTheme();
  const caret = useAnimatedStyle(() => ({
    transform: [{ rotate: withTiming(open ? "180deg" : "0deg", { duration: 200 }) }],
  }));

  return (
    <Animated.View layout={LAYOUT} style={[styles.box, { backgroundColor: colors.surface }]}>
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`${label}, ${summary}`}
        style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.press }]}
      >
        <Text variant="label">{label}</Text>
        <View style={styles.right}>
          {!open ? (
            <Text variant="body" color={filled ? "ink" : "muted"} numberOfLines={1} style={styles.summary}>
              {summary}
            </Text>
          ) : null}
          <Animated.View style={caret}>
            <Icon icon={CaretDownIcon} size={18} color="muted" weight="bold" />
          </Animated.View>
        </View>
      </Pressable>
      {open ? <View style={styles.body}>{children}</View> : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  box: { borderRadius: radius.md, overflow: "hidden" },
  row: {
    minHeight: minTouch + 4,
    paddingHorizontal: space.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: space.md,
  },
  right: { flexDirection: "row", alignItems: "center", gap: space.sm, flexShrink: 1 },
  summary: { flexShrink: 1 },
  body: { paddingHorizontal: space.lg, paddingBottom: space.lg, gap: space.md },
});

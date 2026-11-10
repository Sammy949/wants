import { useState } from "react";
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from "react-native";
import Animated, { useAnimatedStyle, withSpring } from "react-native-reanimated";
import { useTheme } from "@/theme/theme";
import { radius } from "@/theme/tokens";
import { Text } from "./text";

interface Option<T extends string> {
  value: T;
  label: string;
  hint?: string;
}

interface SegmentedProps<T extends string> {
  options: readonly Option<T>[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel: string;
}

const PAD = 3;
// Critically damped: settles without overshoot. Interruptible by design.
const SPRING = { dampingRatio: 1, duration: 320 };

/**
 * One track, one sliding thumb. The thumb follows the selection with a spring
 * that starts from wherever it currently is, so quick taps never jump.
 */
export function Segmented<T extends string>({ options, value, onChange, accessibilityLabel }: SegmentedProps<T>) {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);
  const index = Math.max(0, options.findIndex((o) => o.value === value));
  const segment = width > 0 ? (width - PAD * 2) / options.length : 0;

  const thumb = useAnimatedStyle(() => ({
    transform: [{ translateX: withSpring(index * segment, SPRING) }],
  }));

  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
      style={[styles.track, { backgroundColor: colors.surface }]}
    >
      {segment > 0 ? (
        <Animated.View style={[styles.thumb, { width: segment, backgroundColor: colors.ink }, thumb]} />
      ) : null}
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            accessibilityHint={o.hint}
            style={[
              styles.option,
              // Before the track is measured there's no thumb, so mark the selection directly.
              selected && segment === 0 && { backgroundColor: colors.ink, borderRadius: radius.sm },
            ]}
          >
            <Text variant="label" color={selected ? "bg" : "ink"}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: "row", borderRadius: radius.md, padding: PAD },
  thumb: { position: "absolute", top: PAD, bottom: PAD, left: PAD, borderRadius: radius.sm },
  option: { flex: 1, minHeight: 44, alignItems: "center", justifyContent: "center" },
});

import { useState } from "react";
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from "react-native";
import Svg, { Path } from "react-native-svg";
import { PRICE_LABEL, type Want } from "@/data/wants";
import { formatTargetDate } from "@/lib/dates";
import { menuHaptic } from "@/lib/haptics";
import { formatMoney } from "@/lib/money";
import { useTheme } from "@/theme/theme";
import { space } from "@/theme/tokens";
import { TAG, tagPath } from "./tag-shape";
import { Text } from "./text";

const KIND_LABEL = { thing: "Thing", goal: "Goal", place: "Place" } as const;

export function wantMeta(want: Want): string {
  const parts: string[] = [KIND_LABEL[want.kind]];
  if (want.category) parts.push(want.category);
  if (want.targetDate) parts.push(`by ${formatTargetDate(want.targetDate)}`);
  return parts.join(" · ");
}

interface TagCardProps {
  want: Want;
  onPress?: () => void;
  /** Opens the want's actions. Plays the menu haptic when the press is recognised. */
  onLongPress?: () => void;
}

/**
 * A want, drawn as a price tag. The shape is an SVG sized from layout; the
 * content never waits for it, so the card reads fine on the first frame.
 */
export function TagCard({ want, onPress, onLongPress }: TagCardProps) {
  const { colors } = useTheme();
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const price = want.price ? formatMoney(want.price.minor, want.price.currency) : null;
  const meta = wantMeta(want);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (!size || size.w !== width || size.h !== height) setSize({ w: width, h: height });
  };

  return (
    <Pressable
      onPress={onPress}
      onLongPress={
        onLongPress
          ? () => {
              menuHaptic();
              onLongPress();
            }
          : undefined
      }
      delayLongPress={400}
      accessibilityActions={onLongPress ? [{ name: "longpress", label: "Show actions" }] : undefined}
      onAccessibilityAction={(e) => e.nativeEvent.actionName === "longpress" && onLongPress?.()}
      onLayout={onLayout}
      accessibilityRole="button"
      accessibilityLabel={[want.title, price && `${PRICE_LABEL[want.kind]} ${price}`, meta].filter(Boolean).join(", ")}
      style={styles.card}
    >
      {({ pressed }) => (
        <>
          {size ? (
            <Svg width={size.w} height={size.h} style={StyleSheet.absoluteFill}>
              <Path
                d={tagPath(size.w, size.h)}
                fill={colors.surface}
                fillRule="evenodd"
                opacity={pressed ? 0.7 : 1}
              />
            </Svg>
          ) : null}
          <View style={styles.row}>
            <Text variant="title" numberOfLines={2} style={styles.title}>
              {want.title}
            </Text>
            {price ? <Text variant="number">{price}</Text> : null}
          </View>
          <Text variant="meta" numberOfLines={1}>
            {meta}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingLeft: TAG.contentInset,
    paddingRight: space.lg,
    paddingVertical: space.lg,
    gap: space.xs,
  },
  row: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: space.md,
  },
  title: { flex: 1 },
});

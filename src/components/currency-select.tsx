import { CaretDownIcon } from "phosphor-react-native/src/icons/CaretDown";
import { CheckIcon } from "phosphor-react-native/src/icons/Check";
import { Pressable, StyleSheet, View } from "react-native";
import { CURRENCIES, CURRENCY_INFO, type CurrencyCode } from "@/lib/money";
import { useTheme } from "@/theme/theme";
import { minTouch, radius, space } from "@/theme/tokens";
import { Icon } from "./icon";
import { Text } from "./text";

interface CurrencyButtonProps {
  value: CurrencyCode;
  open: boolean;
  onPress: () => void;
  fill?: "bg" | "surface";
}

/** The closed dropdown: symbol and code. */
export function CurrencyButton({ value, open, onPress, fill = "bg" }: CurrencyButtonProps) {
  const { colors } = useTheme();
  const info = CURRENCY_INFO[value];
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ expanded: open }}
      accessibilityLabel={`Currency, ${info.name}`}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: colors[fill] },
        pressed && { backgroundColor: colors.press },
      ]}
    >
      <Text variant="number">{info.symbol}</Text>
      <Text variant="label" color="muted">
        {value}
      </Text>
      <Icon icon={CaretDownIcon} size={14} color="muted" weight="bold" />
    </Pressable>
  );
}

interface CurrencyListProps {
  value: CurrencyCode;
  onSelect: (code: CurrencyCode) => void;
  fill?: "bg" | "surface";
}

/** The open dropdown: every currency with its symbol and name. */
export function CurrencyList({ value, onSelect, fill = "bg" }: CurrencyListProps) {
  const { colors } = useTheme();
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel="Currency" style={[styles.list, { backgroundColor: colors[fill] }]}>
      {CURRENCIES.map((code) => {
        const selected = code === value;
        const info = CURRENCY_INFO[code];
        return (
          <Pressable
            key={code}
            onPress={() => onSelect(code)}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            accessibilityLabel={`${info.name}, ${code}`}
            style={({ pressed }) => [styles.option, pressed && { backgroundColor: colors.press }]}
          >
            <Text variant="number" style={styles.symbol}>
              {info.symbol}
            </Text>
            <Text variant="body" style={styles.name} numberOfLines={1}>
              {info.name}
            </Text>
            <Text variant="meta">{code}</Text>
            <View style={styles.check}>{selected ? <Icon icon={CheckIcon} size={18} weight="bold" /> : null}</View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: minTouch,
    paddingHorizontal: space.md,
    borderRadius: radius.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: space.xs,
  },
  list: { borderRadius: radius.sm, paddingVertical: space.xs },
  option: {
    minHeight: minTouch,
    paddingHorizontal: space.md,
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
  },
  // Fixed column so names line up whatever the symbol width (₦ vs GH₵).
  symbol: { width: 40 },
  name: { flex: 1 },
  check: { width: 18, alignItems: "center" },
});

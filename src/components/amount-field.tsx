import { useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import type { CurrencyCode } from "@/lib/money";
import { useTheme } from "@/theme/theme";
import { minTouch, radius, space } from "@/theme/tokens";
import { CurrencyButton, CurrencyList } from "./currency-select";

interface AmountFieldProps {
  amount: string;
  onChangeAmount: (text: string) => void;
  currency: CurrencyCode;
  onChangeCurrency: (code: CurrencyCode) => void;
  /** Spoken name, e.g. "Budget". */
  label: string;
  placeholder?: string;
  /** Field colour: "bg" inside a card (default), "surface" when placed on the page. */
  fill?: "bg" | "surface";
}

/** Currency dropdown plus a number field. Raw text; the caller parses on save. */
export function AmountField({
  amount,
  onChangeAmount,
  currency,
  onChangeCurrency,
  label,
  placeholder = "0",
  fill = "bg",
}: AmountFieldProps) {
  const { colors } = useTheme();
  const [listOpen, setListOpen] = useState(false);
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <CurrencyButton value={currency} open={listOpen} fill={fill} onPress={() => setListOpen((o) => !o)} />
        <TextInput
          value={amount}
          onChangeText={onChangeAmount}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          keyboardType="decimal-pad"
          accessibilityLabel={`${label} in ${currency}`}
          style={[styles.input, { backgroundColor: colors[fill], color: colors.ink }]}
        />
      </View>
      {listOpen ? (
        <CurrencyList
          fill={fill}
          value={currency}
          onSelect={(code) => {
            onChangeCurrency(code);
            setListOpen(false);
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.md },
  row: { flexDirection: "row", gap: space.sm },
  input: {
    flex: 1,
    borderRadius: radius.sm,
    paddingHorizontal: space.md,
    paddingVertical: space.md,
    fontSize: 17,
    minHeight: minTouch,
    fontVariant: ["tabular-nums"],
  },
});

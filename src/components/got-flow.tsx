import { CameraIcon } from "phosphor-react-native/src/icons/Camera";
import { ImageIcon } from "phosphor-react-native/src/icons/Image";
import { useEffect, useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import type { Price, Want } from "@/data/wants";
import { useWantsRepo } from "@/data/provider";
import { formatMoney, parseAmount, type CurrencyCode } from "@/lib/money";
import type { PhotoSource } from "@/lib/pick-photo";
import { useTheme } from "@/theme/theme";
import { minTouch, radius, space } from "@/theme/tokens";
import { Button } from "./button";
import { CurrencyButton, CurrencyList } from "./currency-select";
import { Segmented } from "./segmented";
import { Text } from "./text";

type PaidMode = "full" | "different";

interface GotFlowProps {
  want: Want;
  busy: boolean;
  /** Called once the paid amount is valid. source=null means no photo. */
  onConfirm: (source: PhotoSource | null, paid: Price | null) => void;
  onCancel: () => void;
}

/**
 * Two questions, in the order you'd answer them: what did you pay, then the photo.
 * The photo buttons commit, so there is no separate confirm step.
 */
export function GotFlow({ want, busy, onConfirm, onCancel }: GotFlowProps) {
  const { colors } = useTheme();
  const repo = useWantsRepo();
  const hasPrice = want.price !== null;

  const [mode, setMode] = useState<PaidMode>("full");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<CurrencyCode>(want.price?.currency ?? "NGN");
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hasPrice) repo.lastCurrency().then((c) => c && setCurrency(c), () => {});
  }, [hasPrice, repo]);

  const askAmount = !hasPrice || mode === "different";

  function confirm(source: PhotoSource | null) {
    setError(null);
    let paid: Price | null = null;
    if (hasPrice && mode === "full") {
      paid = want.price;
    } else if (amount.trim()) {
      const minor = parseAmount(amount, currency);
      if (minor === null) {
        setError("That amount isn't valid.");
        return;
      }
      paid = { minor, currency };
    }
    onConfirm(source, paid);
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.section}>
        <Text variant="label">{hasPrice ? "What did you pay?" : "Did it cost anything?"}</Text>
        {hasPrice ? (
          <Segmented
            accessibilityLabel="What you paid"
            value={mode}
            onChange={(m) => {
              setMode(m);
              setError(null);
            }}
            options={[
              { value: "full", label: formatMoney(want.price!.minor, want.price!.currency) },
              { value: "different", label: "Different" },
            ]}
          />
        ) : (
          <Text variant="meta">Optional. Leave it empty to skip.</Text>
        )}
        {askAmount ? (
          <>
            <View style={styles.amountRow}>
              <CurrencyButton value={currency} open={currencyOpen} onPress={() => setCurrencyOpen((o) => !o)} />
              <TextInput
                value={amount}
                onChangeText={setAmount}
                placeholder={hasPrice ? "What you paid" : "0"}
                placeholderTextColor={colors.muted}
                keyboardType="decimal-pad"
                accessibilityLabel={`Amount paid in ${currency}`}
                style={[styles.input, { backgroundColor: colors.surface, color: colors.ink }]}
              />
            </View>
            {currencyOpen ? (
              <View style={[styles.list, { backgroundColor: colors.surface }]}>
                <CurrencyList
                  value={currency}
                  onSelect={(c) => {
                    setCurrency(c);
                    setCurrencyOpen(false);
                  }}
                />
              </View>
            ) : null}
          </>
        ) : null}
        {error ? (
          <Text variant="body" color="danger" accessibilityRole="alert">
            {error}
          </Text>
        ) : null}
      </View>

      <View style={styles.section}>
        <Text variant="label">Add a photo of it</Text>
        <Button label="Take a photo" icon={CameraIcon} block disabled={busy} onPress={() => confirm("camera")} />
        <Button
          label="Choose from photos"
          icon={ImageIcon}
          variant="secondary"
          block
          disabled={busy}
          onPress={() => confirm("library")}
        />
        <Button label="Mark as got without a photo" variant="plain" disabled={busy} onPress={() => confirm(null)} />
        <Button label="Not yet" variant="plain" disabled={busy} onPress={onCancel} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.xxl },
  section: { gap: space.md },
  amountRow: { flexDirection: "row", gap: space.sm },
  input: {
    flex: 1,
    borderRadius: radius.sm,
    paddingHorizontal: space.md,
    paddingVertical: space.md,
    fontSize: 17,
    minHeight: minTouch,
    fontVariant: ["tabular-nums"],
  },
  list: { borderRadius: radius.sm, padding: space.xs },
});

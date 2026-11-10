import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Platform, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "@/components/button";
import { CurrencyButton, CurrencyList } from "@/components/currency-select";
import { Disclosure } from "@/components/disclosure";
import { Segmented } from "@/components/segmented";
import { Text } from "@/components/text";
import { useWantsRepo } from "@/data/provider";
import { TITLE_MAX, WantValidationError, type WantKind } from "@/data/wants";
import { formatMoney, parseAmount, type CurrencyCode } from "@/lib/money";
import { useTheme } from "@/theme/theme";
import { fonts, gutter, minTouch, radius, space } from "@/theme/tokens";

const TYPES = [
  { value: "thing", label: "Thing", hint: "Something to buy or own" },
  { value: "goal", label: "Goal", hint: "Something to do or reach" },
  { value: "place", label: "Place", hint: "Somewhere to go" },
] as const;

type Section = "price" | "note" | null;

export default function NewWantSheet() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const repo = useWantsRepo();

  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<WantKind>("thing");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<CurrencyCode>("NGN");
  const [note, setNote] = useState("");
  const [open, setOpen] = useState<Section>(null);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    repo.lastCurrency().then((c) => c && setCurrency(c), () => {});
  }, [repo]);

  const parsed = amount.trim() ? parseAmount(amount, currency) : null;
  const priceSummary = !amount.trim() ? "Add" : parsed === null ? amount : formatMoney(parsed, currency);
  const noteSummary = note.trim() ? note.trim().split("\n")[0] : "Add";

  function toggle(section: Exclude<Section, null>) {
    setOpen((current) => (current === section ? null : section));
    setCurrencyOpen(false);
  }

  async function save() {
    setError(null);
    let price = null;
    if (amount.trim()) {
      if (parsed === null) {
        setOpen("price");
        setError("That price isn't a valid amount.");
        return;
      }
      price = { minor: parsed, currency };
    }
    setSaving(true);
    try {
      await repo.create({ title, kind, price, note });
      router.back();
    } catch (e) {
      setError(e instanceof WantValidationError ? e.message : "Couldn't save. Try again.");
      setSaving(false);
    }
  }

  const field = { backgroundColor: colors.bg, color: colors.ink };

  return (
    <View style={[styles.sheet, { backgroundColor: colors.bg }]}>
      {/* iOS draws its own grabber; Android's sheet doesn't, so draw one. */}
      {Platform.OS === "android" ? <View style={[styles.handle, { backgroundColor: colors.line }]} /> : null}

      <View style={styles.bar}>
        <Text variant="heading" accessibilityRole="header">
          New want
        </Text>
        <Button label="Save" onPress={save} disabled={saving || !title.trim()} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + space.xxl }]}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="What do you want?"
          placeholderTextColor={colors.muted}
          maxLength={TITLE_MAX}
          autoFocus
          returnKeyType="done"
          accessibilityLabel="Name"
          style={[styles.title, { color: colors.ink }]}
        />

        <View style={styles.group}>
          <Text variant="label">Type</Text>
          <Segmented options={TYPES} value={kind} onChange={setKind} accessibilityLabel="Type" />
        </View>

        <View style={styles.optional}>
          <Disclosure
            label="Price"
            summary={priceSummary}
            filled={!!amount.trim()}
            open={open === "price"}
            onToggle={() => toggle("price")}
          >
            <View style={styles.priceRow}>
              <CurrencyButton value={currency} open={currencyOpen} onPress={() => setCurrencyOpen((o) => !o)} />
              <TextInput
                value={amount}
                onChangeText={setAmount}
                placeholder="0"
                placeholderTextColor={colors.muted}
                keyboardType="decimal-pad"
                accessibilityLabel={`Price in ${currency}`}
                style={[styles.input, styles.amount, field]}
              />
            </View>
            {currencyOpen ? (
              <CurrencyList
                value={currency}
                onSelect={(code) => {
                  setCurrency(code);
                  setCurrencyOpen(false);
                }}
              />
            ) : null}
          </Disclosure>

          <Disclosure
            label="Note"
            summary={noteSummary}
            filled={!!note.trim()}
            open={open === "note"}
            onToggle={() => toggle("note")}
          >
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Why you want it, where to find it"
              placeholderTextColor={colors.muted}
              multiline
              autoFocus
              accessibilityLabel="Note"
              style={[styles.input, styles.note, field]}
            />
          </Disclosure>
        </View>

        {error ? (
          <Text variant="body" color="danger" accessibilityRole="alert">
            {error}
          </Text>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1 },
  handle: { alignSelf: "center", width: 36, height: 5, borderRadius: 3, marginTop: space.sm },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: gutter,
    paddingTop: space.lg,
    paddingBottom: space.sm,
  },
  scroll: { flex: 1 },
  body: { paddingHorizontal: gutter, paddingTop: space.sm, gap: space.xxl },
  title: { fontFamily: fonts.display500, fontSize: 24, lineHeight: 32, minHeight: 56, paddingVertical: space.sm },
  group: { gap: space.sm },
  optional: { gap: space.sm },
  priceRow: { flexDirection: "row", gap: space.sm },
  input: {
    borderRadius: radius.sm,
    paddingHorizontal: space.md,
    paddingVertical: space.md,
    fontSize: 17,
    minHeight: minTouch,
  },
  amount: { flex: 1, fontVariant: ["tabular-nums"] },
  note: { minHeight: 96, textAlignVertical: "top" },
});

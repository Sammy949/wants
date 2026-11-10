import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, TextInput, View } from "react-native";
import { Button } from "@/components/button";
import { CurrencyButton, CurrencyList } from "@/components/currency-select";
import { Disclosure } from "@/components/disclosure";
import { Drawer, DrawerGrab, useDrawer } from "@/components/drawer";
import { Segmented } from "@/components/segmented";
import { Text } from "@/components/text";
import { useWantsRepo } from "@/data/provider";
import { PRICE_LABEL, TITLE_MAX, WantValidationError, type WantKind } from "@/data/wants";
import { formatMoney, parseAmount, type CurrencyCode } from "@/lib/money";
import { useTheme } from "@/theme/theme";
import { fonts, gutter, minTouch, radius, space } from "@/theme/tokens";

const TYPES = [
  { value: "thing", label: "Thing", hint: "Something to buy or own" },
  { value: "goal", label: "Goal", hint: "Something to do or reach" },
  { value: "place", label: "Place", hint: "Somewhere to go" },
] as const;

type Section = "price" | "note" | null;

export default function NewWantScreen() {
  return (
    <Drawer onDismiss={() => router.back()} accessibilityLabel="New want">
      <NewWantForm />
    </Drawer>
  );
}

function NewWantForm() {
  const { close } = useDrawer();
  const { colors } = useTheme();
  const repo = useWantsRepo();

  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<WantKind>("thing");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<CurrencyCode>("NGN");
  const [note, setNote] = useState("");
  // Things almost always have a price, so the form starts with it open.
  const [open, setOpen] = useState<Section>("price");
  // Goals hide the cost row until asked for, since most goals don't cost money.
  const [goalCostAsked, setGoalCostAsked] = useState(false);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    repo.lastCurrency().then((c) => c && setCurrency(c), () => {});
  }, [repo]);

  const parsed = amount.trim() ? parseAmount(amount, currency) : null;
  const priceSummary = !amount.trim() ? "Add" : parsed === null ? amount : formatMoney(parsed, currency);
  const noteSummary = note.trim() ? note.trim().split("\n")[0] : "Add";

  const priceLabel = PRICE_LABEL[kind];
  // Never hide a field that has something in it, whatever the type.
  const showPrice = kind !== "goal" || goalCostAsked || amount.trim() !== "";

  function changeType(next: WantKind) {
    setKind(next);
    setCurrencyOpen(false);
    if (amount.trim()) return;
    if (next === "thing") setOpen((o) => o ?? "price");
    else if (open === "price") setOpen(null);
  }

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
        setError(`That ${priceLabel.toLowerCase()} isn't a valid amount.`);
        return;
      }
      price = { minor: parsed, currency };
    }
    setSaving(true);
    try {
      await repo.create({ title, kind, price, note });
      close();
    } catch (e) {
      setError(e instanceof WantValidationError ? e.message : "Couldn't save. Try again.");
      setSaving(false);
    }
  }

  const field = { backgroundColor: colors.bg, color: colors.ink };

  return (
    <>
      <DrawerGrab>
        <View style={styles.bar}>
          <Text variant="heading" accessibilityRole="header">
            New want
          </Text>
          <Button label="Save" onPress={save} disabled={saving || !title.trim()} />
        </View>
      </DrawerGrab>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.body, { paddingBottom: space.xxl }]}
        keyboardShouldPersistTaps="handled"
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
          <Segmented options={TYPES} value={kind} onChange={changeType} accessibilityLabel="Type" />
        </View>

        <View style={styles.optional}>
          {showPrice ? (
            <Disclosure
              label={priceLabel}
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
                  accessibilityLabel={`${priceLabel} in ${currency}`}
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
          ) : null}

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

          {!showPrice ? (
            <Button
              label="Add a cost"
              variant="plain"
              onPress={() => {
                setGoalCostAsked(true);
                setOpen("price");
                setCurrencyOpen(false);
              }}
            />
          ) : null}
        </View>

        {error ? (
          <Text variant="body" color="danger" accessibilityRole="alert">
            {error}
          </Text>
        ) : null}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: gutter,
    paddingTop: space.xs,
    paddingBottom: space.md,
  },
  // Size to content, and shrink (then scroll) when the drawer hits its max height.
  scroll: { flexGrow: 0, flexShrink: 1 },
  body: { paddingHorizontal: gutter, paddingTop: space.sm, gap: space.xxl },
  // No lineHeight here: on iOS it shifts a single-line TextInput's text upward,
  // out of its box and into the header above. Height comes from padding instead.
  title: { fontFamily: fonts.display500, fontSize: 24, minHeight: 56, paddingVertical: space.md },
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

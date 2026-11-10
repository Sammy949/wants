import { useEffect, useState } from "react";
import { Platform, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useWantsRepo } from "@/data/provider";
import { PRICE_LABEL, TITLE_MAX, WantValidationError, type Price, type WantKind } from "@/data/wants";
import { formatTargetDate } from "@/lib/dates";
import { formatMoney, parseAmount, toAmountInput, type CurrencyCode } from "@/lib/money";
import { useTheme } from "@/theme/theme";
import { fonts, gutter, minTouch, radius, space } from "@/theme/tokens";
import { AmountField } from "./amount-field";
import { Button } from "./button";
import { Disclosure } from "./disclosure";
import { Segmented } from "./segmented";
import { defaultTargetDate, TargetDateField } from "./target-date-field";
import { Text } from "./text";

const TYPES = [
  { value: "thing", label: "Thing", hint: "Something to buy or own" },
  { value: "goal", label: "Goal", hint: "Something to do or reach" },
  { value: "place", label: "Place", hint: "Somewhere to go" },
] as const;

type Section = "price" | "paid" | "note" | "date" | null;

export interface WantFormValues {
  title: string;
  kind: WantKind;
  price: Price | null;
  note: string;
  /** Only meaningful when the form was opened with showPaid. */
  paid: Price | null;
  /** Calendar day, YYYY-MM-DD. */
  targetDate: string | null;
}

interface WantFormProps {
  heading: string;
  initial?: Partial<WantFormValues>;
  /** Show the Paid field: for wants that are already got. */
  showPaid?: boolean;
  onSubmit: (values: WantFormValues) => Promise<void>;
}

function amountState(price: Price | null | undefined): [string, CurrencyCode | null] {
  return price ? [toAmountInput(price.minor, price.currency), price.currency] : ["", null];
}

/**
 * The want form, shared by New and Edit. Rendered as the root of a native form
 * sheet, so the ScrollView MUST stay the outermost element: on iOS,
 * react-native-screens forces the first ScrollView in a form sheet to the whole
 * sheet's frame (RNSScreen.mm, applyFrameCorrectionForDescendantScrollView).
 * The header lives inside it as a sticky first child.
 */
export function WantForm({ heading, initial, showPaid = false, onSubmit }: WantFormProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const repo = useWantsRepo();

  const [initialAmount, initialCurrency] = amountState(initial?.price);
  const [initialPaid, initialPaidCurrency] = amountState(initial?.paid);

  const [title, setTitle] = useState(initial?.title ?? "");
  const [kind, setKind] = useState<WantKind>(initial?.kind ?? "thing");
  const [amount, setAmount] = useState(initialAmount);
  const [currency, setCurrency] = useState<CurrencyCode>(initialCurrency ?? "NGN");
  const [paidAmount, setPaidAmount] = useState(initialPaid);
  const [paidCurrency, setPaidCurrency] = useState<CurrencyCode>(initialPaidCurrency ?? initialCurrency ?? "NGN");
  const [note, setNote] = useState(initial?.note ?? "");
  const [targetDate, setTargetDate] = useState<string | null>(initial?.targetDate ?? null);
  // A new thing starts with Price open; an edit starts with everything closed.
  const [open, setOpen] = useState<Section>(initial ? null : "price");
  // Goals hide the cost row until asked for, since most goals don't cost money.
  const [goalCostAsked, setGoalCostAsked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // New wants default to the last currency used; edits keep their own.
  useEffect(() => {
    if (initialCurrency) return;
    repo.lastCurrency().then(
      (c) => {
        if (!c) return;
        setCurrency(c);
        if (!initialPaidCurrency) setPaidCurrency(c);
      },
      () => {},
    );
  }, [initialCurrency, initialPaidCurrency, repo]);

  const parsed = amount.trim() ? parseAmount(amount, currency) : null;
  const parsedPaid = paidAmount.trim() ? parseAmount(paidAmount, paidCurrency) : null;
  const summary = (text: string, value: number | null, code: CurrencyCode) =>
    !text.trim() ? "Add" : value === null ? text : formatMoney(value, code);

  const priceLabel = PRICE_LABEL[kind];
  // Never hide a field that has something in it, whatever the type.
  const showPrice = kind !== "goal" || goalCostAsked || amount.trim() !== "";

  function changeType(next: WantKind) {
    setKind(next);
    if (amount.trim()) return;
    if (next === "thing" && !initial) setOpen((o) => o ?? "price");
    else if (next !== "thing" && open === "price") setOpen(null);
  }

  function toggle(section: Exclude<Section, null>) {
    setOpen((current) => (current === section ? null : section));
  }

  async function save() {
    setError(null);
    if (amount.trim() && parsed === null) {
      setOpen("price");
      setError(`That ${priceLabel.toLowerCase()} isn't a valid amount.`);
      return;
    }
    if (showPaid && paidAmount.trim() && parsedPaid === null) {
      setOpen("paid");
      setError("That paid amount isn't valid.");
      return;
    }
    setSaving(true);
    try {
      await onSubmit({
        title,
        kind,
        note,
        targetDate,
        price: parsed === null ? null : { minor: parsed, currency },
        paid: parsedPaid === null ? null : { minor: parsedPaid, currency: paidCurrency },
      });
    } catch (e) {
      setError(e instanceof WantValidationError ? e.message : "Couldn't save. Try again.");
      setSaving(false);
    }
  }

  return (
    <ScrollView
      style={[styles.sheet, { backgroundColor: colors.bg }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + space.xxl }}
      stickyHeaderIndices={[0]}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
    >
      <View style={{ backgroundColor: colors.bg }}>
        {/* iOS draws its own grabber; Android's sheet doesn't, so draw one. */}
        {Platform.OS === "android" ? <View style={[styles.handle, { backgroundColor: colors.line }]} /> : null}
        <View style={styles.bar}>
          <Text variant="heading" accessibilityRole="header">
            {heading}
          </Text>
          <Button label="Save" onPress={save} disabled={saving || !title.trim()} />
        </View>
      </View>

      <View style={styles.body}>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="What do you want?"
          placeholderTextColor={colors.muted}
          maxLength={TITLE_MAX}
          autoFocus={!initial}
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
              summary={summary(amount, parsed, currency)}
              filled={!!amount.trim()}
              open={open === "price"}
              onToggle={() => toggle("price")}
            >
              <AmountField
                amount={amount}
                onChangeAmount={setAmount}
                currency={currency}
                onChangeCurrency={setCurrency}
                label={priceLabel}
              />
            </Disclosure>
          ) : null}

          {showPaid ? (
            <Disclosure
              label="Paid"
              summary={summary(paidAmount, parsedPaid, paidCurrency)}
              filled={!!paidAmount.trim()}
              open={open === "paid"}
              onToggle={() => toggle("paid")}
            >
              <AmountField
                amount={paidAmount}
                onChangeAmount={setPaidAmount}
                currency={paidCurrency}
                onChangeCurrency={setPaidCurrency}
                label="Paid"
              />
            </Disclosure>
          ) : null}

          <Disclosure
            label="Note"
            summary={note.trim() ? note.trim().split("\n")[0] : "Add"}
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
              style={[styles.note, { backgroundColor: colors.bg, color: colors.ink }]}
            />
          </Disclosure>

          <Disclosure
            label="Target date"
            summary={targetDate ? formatTargetDate(targetDate) : "Add"}
            filled={!!targetDate}
            open={open === "date"}
            onToggle={() => {
              if (!targetDate) setTargetDate(defaultTargetDate());
              toggle("date");
            }}
          >
            {targetDate ? (
              <TargetDateField
                value={targetDate}
                onChange={setTargetDate}
                onRemove={() => {
                  setTargetDate(null);
                  setOpen(null);
                }}
              />
            ) : null}
          </Disclosure>

          {!showPrice ? (
            <Button
              label="Add a cost"
              variant="plain"
              onPress={() => {
                setGoalCostAsked(true);
                setOpen("price");
              }}
            />
          ) : null}
        </View>

        {error ? (
          <Text variant="body" color="danger" accessibilityRole="alert">
            {error}
          </Text>
        ) : null}
      </View>
    </ScrollView>
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
    paddingBottom: space.md,
  },
  body: { paddingHorizontal: gutter, paddingTop: space.sm, gap: space.xxl },
  // No lineHeight: it misplaces single-line TextInput text on iOS. Height comes from padding.
  title: { fontFamily: fonts.display500, fontSize: 24, minHeight: 56, paddingVertical: space.md },
  group: { gap: space.sm },
  optional: { gap: space.sm },
  note: {
    borderRadius: radius.sm,
    paddingHorizontal: space.md,
    paddingVertical: space.md,
    fontSize: 17,
    minHeight: Math.max(96, minTouch),
    textAlignVertical: "top",
  },
});

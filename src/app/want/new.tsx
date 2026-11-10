import { router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "@/components/button";
import { Text } from "@/components/text";
import { useWantsRepo } from "@/data/provider";
import { TITLE_MAX, WantValidationError, type WantKind } from "@/data/wants";
import { CURRENCIES, parseAmount, type CurrencyCode } from "@/lib/money";
import { useTheme } from "@/theme/theme";
import { gutter, minTouch, radius, space } from "@/theme/tokens";

const KINDS: { key: WantKind; label: string; hint: string }[] = [
  { key: "thing", label: "Thing", hint: "Something to buy or own" },
  { key: "goal", label: "Goal", hint: "Something to do or reach" },
  { key: "place", label: "Place", hint: "Somewhere to go" },
];

export default function NewWantScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const repo = useWantsRepo();

  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<WantKind>("thing");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<CurrencyCode>("NGN");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const input = [styles.input, { backgroundColor: colors.surface, color: colors.ink }];

  async function save() {
    setError(null);
    let price = null;
    if (amount.trim()) {
      const minor = parseAmount(amount, currency);
      if (minor === null) {
        setError("That price isn't a valid amount.");
        return;
      }
      price = { minor, currency };
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

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.bar, { paddingTop: Platform.OS === "android" ? insets.top + space.sm : space.lg }]}>
        <Button label="Cancel" variant="plain" onPress={() => router.back()} />
        <Text variant="label" accessibilityRole="header">
          New want
        </Text>
        <Button label="Save" variant="plain" onPress={save} disabled={saving || !title.trim()} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + space.xxxl }]}
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
          style={[input, styles.titleInput]}
        />

        <View style={styles.field}>
          <Text variant="label">Kind</Text>
          <View style={styles.kinds} accessibilityRole="radiogroup">
            {KINDS.map((k) => {
              const selected = kind === k.key;
              return (
                <Pressable
                  key={k.key}
                  onPress={() => setKind(k.key)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  accessibilityHint={k.hint}
                  style={[
                    styles.kind,
                    { backgroundColor: selected ? colors.ink : colors.surface },
                  ]}
                >
                  <Text variant="label" color={selected ? "bg" : "ink"}>
                    {k.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.field}>
          <Text variant="label">
            Price <Text variant="meta">optional</Text>
          </Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            placeholder="0"
            placeholderTextColor={colors.muted}
            keyboardType="decimal-pad"
            accessibilityLabel={`Price in ${currency}`}
            style={[input, styles.number]}
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.currencies}
            accessibilityRole="radiogroup"
            accessibilityLabel="Currency"
            keyboardShouldPersistTaps="handled"
          >
            {CURRENCIES.map((code) => {
              const selected = code === currency;
              return (
                <Pressable
                  key={code}
                  onPress={() => setCurrency(code)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  style={[styles.currency, selected && { backgroundColor: colors.surface }]}
                >
                  <Text variant={selected ? "label" : "body"} color={selected ? "ink" : "muted"}>
                    {code}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.field}>
          <Text variant="label">
            Note <Text variant="meta">optional</Text>
          </Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Why you want it, where to find it"
            placeholderTextColor={colors.muted}
            multiline
            accessibilityLabel="Note"
            style={[input, styles.note]}
          />
        </View>

        {error ? (
          <Text variant="body" color="danger" accessibilityLiveRegion="polite" accessibilityRole="alert">
            {error}
          </Text>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: space.sm,
    paddingBottom: space.sm,
  },
  body: { paddingHorizontal: gutter, paddingTop: space.md, gap: space.xxl },
  input: {
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    fontSize: 17,
    minHeight: minTouch,
  },
  titleInput: { fontSize: 20, minHeight: 56 },
  field: { gap: space.sm },
  kinds: { flexDirection: "row", gap: space.sm },
  kind: {
    flex: 1,
    minHeight: minTouch,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  number: { fontVariant: ["tabular-nums"] },
  currencies: { gap: space.xs },
  currency: {
    minHeight: 40,
    minWidth: 52,
    paddingHorizontal: space.md,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  note: { minHeight: 96, textAlignVertical: "top" },
});

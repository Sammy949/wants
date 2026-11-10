import { CaretLeftIcon } from "phosphor-react-native/src/icons/CaretLeft";
import { PlusIcon } from "phosphor-react-native/src/icons/Plus";
import { useState } from "react";
import { Platform, Pressable, StyleSheet, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AmountField } from "@/components/amount-field";
import { Button, IconButton } from "@/components/button";
import { Icon } from "@/components/icon";
import { Text } from "@/components/text";
import { TITLE_MAX } from "@/data/wants";
import { useTheme } from "@/theme/theme";
import { fonts, gutter, minTouch, radius, space } from "@/theme/tokens";
import { TYPE_OPTIONS } from "./type-options";
import { useNewWantDraft } from "./use-draft";

const STEPS = 3;

/**
 * New want, one question at a time:
 *   1. What do you want?  -> Next
 *   2. What kind?         -> pick, then Next (no auto-advance: Next stays the rhythm)
 *   3. Anything else?     -> compact extras added on tap, then Add want
 *
 * Shown in a form sheet sized to its content (fitToContents), so the sheet
 * resizes per step. The root is a plain View, not a ScrollView: on iOS,
 * react-native-screens forces the first ScrollView in a form sheet to the
 * sheet's full frame, and a content-sized sheet doesn't need to scroll.
 */
export function NewWantFlow() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const d = useNewWantDraft({ selectionHaptic: true });
  const [step, setStep] = useState(0);
  const [priceAsked, setPriceAsked] = useState(false);
  const [noteAsked, setNoteAsked] = useState(false);

  const next = () => setStep((s) => Math.min(STEPS - 1, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));

  // Things show their price straight away; goals and places add one on tap.
  // A field with something in it is never hidden.
  const showPrice = d.kind === "thing" || priceAsked || !!d.amount.trim();
  const showNote = noteAsked || !!d.note.trim();

  return (
    <View style={[styles.root, { backgroundColor: colors.bg, paddingBottom: insets.bottom + space.md }]}>
      {/* iOS draws its own grabber; Android's sheet doesn't. */}
      {Platform.OS === "android" ? <View style={[styles.handle, { backgroundColor: colors.line }]} /> : null}

      <View style={styles.top}>
        {step > 0 ? (
          <IconButton icon={CaretLeftIcon} accessibilityLabel="Previous step" onPress={back} />
        ) : (
          <View style={styles.spacer} />
        )}
        <Text variant="meta" accessibilityLabel={`Step ${step + 1} of ${STEPS}`}>
          {step + 1} of {STEPS}
        </Text>
        <View style={styles.spacer} />
      </View>

      {step === 0 ? (
        <View style={styles.step}>
          <Text variant="heading" accessibilityRole="header">
            What do you want?
          </Text>
          <TextInput
            value={d.title}
            onChangeText={d.setTitle}
            placeholder="A thing, a goal, a place"
            placeholderTextColor={colors.muted}
            maxLength={TITLE_MAX}
            autoFocus
            returnKeyType="next"
            onSubmitEditing={() => d.title.trim() && next()}
            accessibilityLabel="Name"
            style={[styles.title, { backgroundColor: colors.surface, color: colors.ink }]}
          />
          <Button label="Next" block disabled={!d.title.trim()} onPress={next} />
        </View>
      ) : null}

      {step === 1 ? (
        <View style={styles.step}>
          <Text variant="heading" accessibilityRole="header">
            What kind of want?
          </Text>
          <View style={styles.choices} accessibilityRole="radiogroup" accessibilityLabel="Type">
            {TYPE_OPTIONS.map((t) => {
              const selected = d.kind === t.value;
              return (
                <Pressable
                  key={t.value}
                  onPress={() => d.setKind(t.value)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  style={({ pressed }) => [
                    styles.choice,
                    { backgroundColor: selected ? colors.ink : colors.surface },
                    pressed && !selected && { backgroundColor: colors.press },
                  ]}
                >
                  <Icon icon={t.icon} size={24} color={selected ? "bg" : "ink"} weight={selected ? "fill" : "regular"} />
                  <View style={styles.choiceText}>
                    <Text variant="label" color={selected ? "bg" : "ink"}>
                      {t.label}
                    </Text>
                    <Text variant="meta" color={selected ? "bg" : "muted"}>
                      {t.hint}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
          <Button label="Next" block onPress={next} />
        </View>
      ) : null}

      {step === 2 ? (
        <View style={styles.step}>
          <Text variant="heading" accessibilityRole="header">
            Anything else?
          </Text>

          {showPrice ? (
            <View style={styles.field}>
              <Text variant="meta">{d.priceLabel}</Text>
              <AmountField
                amount={d.amount}
                onChangeAmount={d.setAmount}
                currency={d.currency}
                onChangeCurrency={d.setCurrency}
                label={d.priceLabel}
                fill="surface"
              />
            </View>
          ) : null}

          {showNote ? (
            <View style={styles.field}>
              <Text variant="meta">Note</Text>
              <TextInput
                value={d.note}
                onChangeText={d.setNote}
                placeholder="Why you want it, where to find it"
                placeholderTextColor={colors.muted}
                multiline
                autoFocus
                accessibilityLabel="Note"
                style={[styles.note, { backgroundColor: colors.surface, color: colors.ink }]}
              />
            </View>
          ) : null}

          {!showPrice || !showNote ? (
            <View style={styles.extras}>
              {!showPrice ? (
                <Button label={d.priceLabel} variant="plain" icon={PlusIcon} onPress={() => setPriceAsked(true)} />
              ) : null}
              {!showNote ? (
                <Button label="Note" variant="plain" icon={PlusIcon} onPress={() => setNoteAsked(true)} />
              ) : null}
            </View>
          ) : null}

          {d.error ? (
            <Text variant="body" color="danger" accessibilityRole="alert">
              {d.error}
            </Text>
          ) : null}

          <Button label="Add want" block disabled={!d.canSave} onPress={d.save} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { paddingHorizontal: gutter, paddingTop: space.md, gap: space.md },
  handle: { position: "absolute", top: space.sm, alignSelf: "center", width: 36, height: 5, borderRadius: 3 },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginHorizontal: -space.md },
  spacer: { width: minTouch, height: minTouch },
  step: { gap: space.lg },
  title: {
    fontFamily: fonts.display500,
    fontSize: 22,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    minHeight: 60,
  },
  choices: { gap: space.sm },
  choice: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.lg,
    paddingHorizontal: space.lg,
    minHeight: 64,
    borderRadius: radius.md,
  },
  choiceText: { gap: 2, flex: 1 },
  field: { gap: space.xs },
  note: {
    borderRadius: radius.sm,
    paddingHorizontal: space.md,
    paddingVertical: space.md,
    fontSize: 17,
    minHeight: 80,
    textAlignVertical: "top",
  },
  // Plain buttons carry their own side padding; pull the row back to the gutter.
  extras: { flexDirection: "row", marginLeft: -space.xl, marginTop: -space.sm },
});

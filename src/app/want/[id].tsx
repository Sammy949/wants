import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useRef } from "react";
import { ScrollView, StyleSheet, View, type ScrollViewInstance } from "react-native";
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring } from "react-native-reanimated";
import { GotFlow } from "@/components/got-flow";
import { GotStamp } from "@/components/got-stamp";
import { Text } from "@/components/text";
import { ActionBar, Message, TopBar } from "@/components/want-detail/parts";
import { useWantDetail } from "@/components/want-detail/use-want-detail";
import { photoUri } from "@/data/photos";
import { PRICE_LABEL } from "@/data/wants";
import { formatDay, formatTargetDate } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { useTheme } from "@/theme/theme";
import { gutter, radius, space } from "@/theme/tokens";

const KIND = { thing: "Thing", goal: "Goal", place: "Place" } as const;

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.cell}>
      <Text variant="meta">{label}</Text>
      <Text variant="label">{value}</Text>
    </View>
  );
}

/**
 * A want, calmly: no cards. A status line, a big title, one big amount (what
 * you paid once got, otherwise the price), a grid of facts, the note, and the
 * proof photo. The main action is pinned at the bottom; Edit and Delete sit in
 * the top bar. Chosen from an in-app comparison of four layouts (option C).
 */
export default function WantScreen() {
  // got=1 arrives when a got interrupted by Android was finished on relaunch.
  // choose=1 arrives from the actions sheet's "I got it".
  const { id, got, choose } = useLocalSearchParams<{ id: string; got?: string; choose?: string }>();
  const { colors } = useTheme();
  const detail = useWantDetail(Number(id), { startCelebrating: got === "1", startChoosing: choose === "1" });
  const { want, celebrating } = detail;

  const scrollRef = useRef<ScrollViewInstance>(null);
  const reduceMotion = useReducedMotion();
  const photoScale = useSharedValue(1);
  const photoStyle = useAnimatedStyle(() => ({ transform: [{ scale: photoScale.get() }] }));

  useEffect(() => {
    if (!celebrating) return;
    // The stamp is at the top; the got flow was further down.
    scrollRef.current?.scrollTo({ y: 0, animated: !reduceMotion });
    if (!reduceMotion) {
      photoScale.set(0.94);
      photoScale.set(withSpring(1, { dampingRatio: 1, duration: 520 }));
    }
  }, [celebrating, reduceMotion, photoScale]);

  if (detail.missing || !want) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.bg }]}>
        <TopBar detail={detail} />
        {detail.missing ? (
          <Text variant="heading" style={styles.pad}>
            This want isn&apos;t here any more.
          </Text>
        ) : null}
      </View>
    );
  }

  // Once got, what you paid is the headline number; the price moves to the facts.
  const amount = want.paid ?? want.price;
  const amountLabel = want.paid ? "Paid" : PRICE_LABEL[want.kind];
  const facts: { label: string; value: string }[] = [{ label: "Type", value: KIND[want.kind] }];
  if (want.targetDate) facts.push({ label: "Aiming for", value: formatTargetDate(want.targetDate) });
  if (want.paid && want.price) {
    facts.push({ label: PRICE_LABEL[want.kind], value: formatMoney(want.price.minor, want.price.currency) });
  }
  facts.push({ label: "Added", value: formatDay(want.createdAt) });

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <TopBar detail={detail} />
      <ScrollView ref={scrollRef} contentContainerStyle={styles.body}>
        <View style={styles.status}>
          {want.gotAt ? <GotStamp celebrate={celebrating} size={44} /> : null}
          <Text variant="label" color={want.gotAt ? "accent" : "muted"}>
            {want.gotAt ? `Got ${formatDay(want.gotAt)}` : `Wanting since ${formatDay(want.createdAt)}`}
          </Text>
        </View>

        <Text variant="display" accessibilityRole="header" style={styles.title}>
          {want.title}
        </Text>

        {amount ? (
          <View style={styles.amount}>
            <Text variant="meta">{amountLabel}</Text>
            <Text variant="number" style={styles.bigNumber}>
              {formatMoney(amount.minor, amount.currency)}
            </Text>
          </View>
        ) : null}

        <View style={styles.grid}>
          {facts.map((f) => (
            <Fact key={f.label} label={f.label} value={f.value} />
          ))}
        </View>

        {want.note ? <Text variant="body">{want.note}</Text> : null}

        {want.gotAt && want.proofPhoto ? (
          <Animated.View style={photoStyle}>
            <Image
              source={{ uri: photoUri(want.proofPhoto) }}
              style={[styles.photo, { backgroundColor: colors.surface }]}
              contentFit="cover"
              accessibilityLabel={`Photo of ${want.title}`}
            />
          </Animated.View>
        ) : null}

        <Message detail={detail} />
        {detail.choosing ? (
          <GotFlow
            want={want}
            busy={detail.busy}
            onConfirm={detail.markGot}
            onCancel={() => detail.setChoosing(false)}
          />
        ) : null}
      </ScrollView>
      <ActionBar detail={detail} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  pad: { paddingHorizontal: gutter },
  body: { paddingHorizontal: gutter, paddingTop: space.lg, paddingBottom: space.xxl, gap: space.xl },
  status: { flexDirection: "row", alignItems: "center", gap: space.md },
  title: { fontSize: 38, lineHeight: 44 },
  amount: { gap: 2 },
  bigNumber: { fontSize: 34, lineHeight: 40, fontWeight: "700" },
  grid: { flexDirection: "row", flexWrap: "wrap", rowGap: space.lg },
  cell: { width: "50%", gap: 2, paddingRight: space.md },
  photo: { width: "100%", aspectRatio: 4 / 3, borderRadius: radius.lg },
});

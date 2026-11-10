import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowUUpLeftIcon } from "phosphor-react-native/src/icons/ArrowUUpLeft";
import { CaretLeftIcon } from "phosphor-react-native/src/icons/CaretLeft";
import { CheckCircleIcon } from "phosphor-react-native/src/icons/CheckCircle";
import { PencilSimpleIcon } from "phosphor-react-native/src/icons/PencilSimple";
import { RepeatIcon } from "phosphor-react-native/src/icons/Repeat";
import { TrashIcon } from "phosphor-react-native/src/icons/Trash";
import { useEffect, useRef } from "react";
import { Linking, ScrollView, StyleSheet, View, type ScrollViewInstance } from "react-native";
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, IconButton } from "@/components/button";
import { GotFlow } from "@/components/got-flow";
import { GotStamp } from "@/components/got-stamp";
import { wantMeta } from "@/components/tag-card";
import { Text } from "@/components/text";
import { useWantDetail } from "@/components/want-detail/use-want-detail";
import { photoUri } from "@/data/photos";
import { PRICE_LABEL } from "@/data/wants";
import { formatDay } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { useTheme } from "@/theme/theme";
import { gutter, radius, space } from "@/theme/tokens";

export default function WantScreen() {
  // got=1 arrives when a got interrupted by Android was finished on relaunch.
  const { id, got } = useLocalSearchParams<{ id: string; got?: string }>();
  const wantId = Number(id);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const detail = useWantDetail(wantId, { startCelebrating: got === "1" });
  const { want, choosing, setChoosing, busy, message, justGot, celebrating, markGot, undoGot, wantAgain, confirmDelete } =
    detail;
  const scrollRef = useRef<ScrollViewInstance>(null);
  const reduceMotion = useReducedMotion();
  const photoScale = useSharedValue(1);
  const photoStyle = useAnimatedStyle(() => ({ transform: [{ scale: photoScale.get() }] }));

  useEffect(() => {
    if (!celebrating) return;
    // Bring the photo and stamp into view; the got flow was further down.
    scrollRef.current?.scrollTo({ y: 0, animated: !reduceMotion });
    if (!reduceMotion) {
      photoScale.set(0.94);
      photoScale.set(withSpring(1, { dampingRatio: 1, duration: 520 }));
    }
  }, [celebrating, reduceMotion, photoScale]);

  const back = (
    <View style={[styles.bar, { paddingTop: insets.top + space.xs }]}>
      <IconButton icon={CaretLeftIcon} accessibilityLabel="Back" onPress={() => router.back()} />
      {want ? (
        <IconButton
          icon={PencilSimpleIcon}
          accessibilityLabel="Edit"
          onPress={detail.edit}
        />
      ) : null}
    </View>
  );

  if (detail.missing) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        {back}
        <View style={styles.body}>
          <Text variant="heading">This want isn&apos;t here any more.</Text>
        </View>
      </View>
    );
  }
  if (!want) return <View style={{ flex: 1, backgroundColor: colors.bg }}>{back}</View>;

  const price = want.price ? formatMoney(want.price.minor, want.price.currency) : null;
  const paid = want.paid ? formatMoney(want.paid.minor, want.paid.currency) : null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {back}
      <ScrollView ref={scrollRef} contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + space.xxxl }]}>
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

        <View style={styles.head}>
          {want.gotAt ? (
            <View style={styles.gotRow}>
              <GotStamp celebrate={celebrating} />
              <Text variant="label" style={styles.gotLabel}>
                Got {formatDay(want.gotAt)}
              </Text>
              {justGot ? <Button label="Undo" variant="plain" icon={ArrowUUpLeftIcon} onPress={undoGot} /> : null}
            </View>
          ) : null}
          <Text variant="display" accessibilityRole="header">
            {want.title}
          </Text>
          {price || paid ? (
            <View style={styles.amounts}>
              {price ? (
                <View style={styles.amount}>
                  <Text variant="meta">{PRICE_LABEL[want.kind]}</Text>
                  <Text variant="number" style={styles.price}>
                    {price}
                  </Text>
                </View>
              ) : null}
              {paid ? (
                <View style={styles.amount}>
                  <Text variant="meta">Paid</Text>
                  <Text variant="number" style={styles.price}>
                    {paid}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}
          <Text variant="meta">{wantMeta(want)}</Text>
        </View>

        {want.note ? <Text variant="body">{want.note}</Text> : null}

        {message ? (
          <View style={styles.message}>
            <Text variant="body" color="danger" accessibilityRole="alert">
              {message}
            </Text>
            {message.includes("Settings") ? (
              <Button label="Open Settings" variant="secondary" onPress={() => Linking.openSettings()} />
            ) : null}
          </View>
        ) : null}

        {want.gotAt ? (
          <View style={styles.actions}>
            <Button label="Want it again" variant="secondary" icon={RepeatIcon} onPress={wantAgain} />
          </View>
        ) : choosing ? (
          <GotFlow want={want} busy={busy} onConfirm={markGot} onCancel={() => setChoosing(false)} />
        ) : (
          <View style={styles.actions}>
            <Button label="I got it" icon={CheckCircleIcon} block onPress={() => setChoosing(true)} />
          </View>
        )}

        <View style={styles.danger}>
          <Button label="Delete" variant="danger" icon={TrashIcon} onPress={confirmDelete} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { paddingHorizontal: space.sm, flexDirection: "row", justifyContent: "space-between" },
  body: { paddingHorizontal: gutter, paddingTop: space.sm, gap: space.xl },
  photo: { width: "100%", aspectRatio: 4 / 5, borderRadius: radius.lg },
  head: { gap: space.sm },
  gotRow: { flexDirection: "row", alignItems: "center", gap: space.md, marginBottom: space.xs },
  gotLabel: { flex: 1 },
  amounts: { flexDirection: "row", gap: space.xxl },
  amount: { gap: 2 },
  price: { fontSize: 20, lineHeight: 26 },
  message: { gap: space.md, alignItems: "flex-start" },
  actions: { gap: space.md },
  danger: { marginTop: space.lg, alignItems: "flex-start" },
});

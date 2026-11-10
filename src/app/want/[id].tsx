import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowUUpLeftIcon } from "phosphor-react-native/src/icons/ArrowUUpLeft";
import { CaretLeftIcon } from "phosphor-react-native/src/icons/CaretLeft";
import { PencilSimpleIcon } from "phosphor-react-native/src/icons/PencilSimple";
import { RepeatIcon } from "phosphor-react-native/src/icons/Repeat";
import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Alert, Linking, ScrollView, StyleSheet, View, type ScrollViewInstance } from "react-native";
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, IconButton } from "@/components/button";
import { GotFlow } from "@/components/got-flow";
import { GotStamp } from "@/components/got-stamp";
import { wantMeta } from "@/components/tag-card";
import { Text } from "@/components/text";
import { deletePhotos, photoUri, savePhoto } from "@/data/photos";
import { useLiveQuery, useWantsRepo } from "@/data/provider";
import { PRICE_LABEL, type Price } from "@/data/wants";
import { formatDay } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { pickPhoto, type PhotoSource } from "@/lib/pick-photo";
import { useTheme } from "@/theme/theme";
import { gutter, radius, space } from "@/theme/tokens";

export default function WantScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const wantId = Number(id);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const repo = useWantsRepo();
  const { data: want, error } = useLiveQuery(`want:${wantId}`, (r) => r.get(wantId));
  const [choosing, setChoosing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  // True only right after marking as got on this screen, so the moment plays once.
  const [justGot, setJustGot] = useState(false);
  const scrollRef = useRef<ScrollViewInstance>(null);
  const reduceMotion = useReducedMotion();
  const photoScale = useSharedValue(1);
  const photoStyle = useAnimatedStyle(() => ({ transform: [{ scale: photoScale.get() }] }));

  const celebrating = justGot && !!want?.gotAt;
  useEffect(() => {
    if (!celebrating) return;
    // Bring the photo and stamp into view; the got flow was further down.
    scrollRef.current?.scrollTo({ y: 0, animated: !reduceMotion });
    AccessibilityInfo.announceForAccessibility("Marked as got.");
    if (!reduceMotion) {
      photoScale.set(0.94);
      photoScale.set(withSpring(1, { dampingRatio: 1, duration: 520 }));
    }
  }, [celebrating, reduceMotion, photoScale]);

  async function markGot(source: PhotoSource | null, paid: Price | null) {
    setMessage(null);
    let saved: string | null = null;
    try {
      if (source) {
        const picked = await pickPhoto(source);
        if (picked.status === "cancelled") return;
        if (picked.status === "denied") {
          setMessage(
            picked.canAskAgain
              ? "wants needs the camera to take the photo."
              : "Camera access is off for wants. Turn it on in Settings, or choose a photo instead.",
          );
          return;
        }
        setBusy(true);
        saved = await savePhoto(picked.uri);
      }
      setBusy(true);
      await repo.markGot(wantId, { proofPhoto: saved, paid });
      setChoosing(false);
      setJustGot(true);
    } catch {
      // Don't leave a copied photo behind if the database write failed.
      if (saved) deletePhotos([saved]);
      setMessage("Couldn't save that. Try again.");
    } finally {
      setBusy(false);
    }
  }

  /**
   * Undo is only offered right after marking, for a mistaken tap. A want that
   * was really got stays got; wanting it again makes a new want (below).
   */
  async function undoGot() {
    setJustGot(false);
    try {
      const { removedPhoto } = await repo.unmarkGot(wantId);
      if (removedPhoto) deletePhotos([removedPhoto]);
      AccessibilityInfo.announceForAccessibility("Moved back to wants.");
    } catch {
      setMessage("Couldn't undo that. Try again.");
    }
  }

  /** A fresh want with the same details. The got one keeps its photo and date. */
  async function wantAgain() {
    if (!want) return;
    try {
      const again = await repo.create({
        title: want.title,
        kind: want.kind,
        price: want.price,
        note: want.note,
        category: want.category,
      });
      router.replace(`/want/${again.id}`);
    } catch {
      setMessage("Couldn't add it again. Try again.");
    }
  }

  function confirmDelete() {
    Alert.alert("Delete this want?", "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const orphaned = await repo.remove(wantId);
          deletePhotos(orphaned);
          router.back();
        },
      },
    ]);
  }

  const back = (
    <View style={[styles.bar, { paddingTop: insets.top + space.xs }]}>
      <IconButton icon={CaretLeftIcon} accessibilityLabel="Back" onPress={() => router.back()} />
      {want ? (
        <IconButton
          icon={PencilSimpleIcon}
          accessibilityLabel="Edit"
          onPress={() => router.push(`/want/edit/${wantId}`)}
        />
      ) : null}
    </View>
  );

  if (error || (want === null)) {
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
            <Button label="I got it" block onPress={() => setChoosing(true)} />
          </View>
        )}

        <View style={styles.danger}>
          <Button label="Delete" variant="danger" onPress={confirmDelete} />
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

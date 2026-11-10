import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowCounterClockwiseIcon } from "phosphor-react-native/src/icons/ArrowCounterClockwise";
import { CameraIcon } from "phosphor-react-native/src/icons/Camera";
import { CaretLeftIcon } from "phosphor-react-native/src/icons/CaretLeft";
import { ImageIcon } from "phosphor-react-native/src/icons/Image";
import { useState } from "react";
import { Alert, Linking, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, IconButton } from "@/components/button";
import { wantMeta } from "@/components/tag-card";
import { Text } from "@/components/text";
import { deletePhotos, photoUri, savePhoto } from "@/data/photos";
import { useLiveQuery, useWantsRepo } from "@/data/provider";
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

  async function markGot(source: PhotoSource | null) {
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
      await repo.markGot(wantId, saved);
      setChoosing(false);
    } catch {
      // Don't leave a copied photo behind if the database write failed.
      if (saved) deletePhotos([saved]);
      setMessage("Couldn't save that. Try again.");
    } finally {
      setBusy(false);
    }
  }

  function confirmUnmark() {
    Alert.alert("Move back to wants?", "The proof photo will be deleted.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Move back",
        style: "destructive",
        onPress: async () => {
          const { removedPhoto } = await repo.unmarkGot(wantId);
          if (removedPhoto) deletePhotos([removedPhoto]);
        },
      },
    ]);
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

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {back}
      <ScrollView contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + space.xxxl }]}>
        {want.gotAt && want.proofPhoto ? (
          <Image
            source={{ uri: photoUri(want.proofPhoto) }}
            style={[styles.photo, { backgroundColor: colors.surface }]}
            contentFit="cover"
            accessibilityLabel={`Photo of ${want.title}`}
          />
        ) : null}

        <View style={styles.head}>
          <Text variant="display" accessibilityRole="header">
            {want.title}
          </Text>
          {price ? (
            <Text variant="number" style={styles.price}>
              {price}
            </Text>
          ) : null}
          <Text variant="meta">
            {want.gotAt ? `Got ${formatDay(want.gotAt)} · ${wantMeta(want)}` : wantMeta(want)}
          </Text>
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
            <Button
              label="Move back to wants"
              variant="secondary"
              icon={ArrowCounterClockwiseIcon}
              onPress={confirmUnmark}
            />
          </View>
        ) : choosing ? (
          <View style={styles.actions}>
            <Text variant="label">Add a photo of it</Text>
            <Button label="Take a photo" icon={CameraIcon} block disabled={busy} onPress={() => markGot("camera")} />
            <Button
              label="Choose from photos"
              icon={ImageIcon}
              variant="secondary"
              block
              disabled={busy}
              onPress={() => markGot("library")}
            />
            <Button label="Mark as got without a photo" variant="plain" disabled={busy} onPress={() => markGot(null)} />
            <Button label="Not yet" variant="plain" disabled={busy} onPress={() => setChoosing(false)} />
          </View>
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
  bar: { paddingHorizontal: space.sm },
  body: { paddingHorizontal: gutter, paddingTop: space.sm, gap: space.xl },
  photo: { width: "100%", aspectRatio: 4 / 5, borderRadius: radius.lg },
  head: { gap: space.xs },
  price: { fontSize: 20, lineHeight: 26 },
  message: { gap: space.md, alignItems: "flex-start" },
  actions: { gap: space.md },
  danger: { marginTop: space.lg, alignItems: "flex-start" },
});

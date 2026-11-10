import { router } from "expo-router";
import { ArrowUUpLeftIcon } from "phosphor-react-native/src/icons/ArrowUUpLeft";
import { CaretLeftIcon } from "phosphor-react-native/src/icons/CaretLeft";
import { CheckCircleIcon } from "phosphor-react-native/src/icons/CheckCircle";
import { PencilSimpleIcon } from "phosphor-react-native/src/icons/PencilSimple";
import { RepeatIcon } from "phosphor-react-native/src/icons/Repeat";
import { TrashIcon } from "phosphor-react-native/src/icons/Trash";
import { Linking, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, IconButton } from "@/components/button";
import { Text } from "@/components/text";
import type { WantDetail } from "@/components/want-detail/use-want-detail";
import { useTheme } from "@/theme/theme";
import { gutter, space } from "@/theme/tokens";

/** Pieces of the want detail screen: top bar, pinned action, error message. */

export function TopBar({ detail }: { detail: WantDetail }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingTop: insets.top + space.xs }]}>
      <IconButton icon={CaretLeftIcon} accessibilityLabel="Back" onPress={() => router.back()} />
      {detail.want ? (
        <View style={styles.right}>
          <IconButton icon={PencilSimpleIcon} accessibilityLabel="Edit" onPress={detail.edit} />
          <IconButton icon={TrashIcon} color="danger" accessibilityLabel="Delete" onPress={detail.confirmDelete} />
        </View>
      ) : null}
    </View>
  );
}

/** Pinned at the bottom, like New want on the list. Hidden while choosing a photo. */
export function ActionBar({ detail }: { detail: WantDetail }) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  if (!detail.want || detail.choosing) return null;
  return (
    <View style={[styles.action, { paddingBottom: insets.bottom + space.md, backgroundColor: colors.bg }]}>
      {detail.want.gotAt ? (
        detail.justGot ? (
          <Button label="Undo" variant="secondary" icon={ArrowUUpLeftIcon} block onPress={detail.undoGot} />
        ) : (
          <Button label="Want it again" variant="secondary" icon={RepeatIcon} block onPress={detail.wantAgain} />
        )
      ) : (
        <Button label="I got it" icon={CheckCircleIcon} block onPress={() => detail.setChoosing(true)} />
      )}
    </View>
  );
}

export function Message({ detail }: { detail: WantDetail }) {
  if (!detail.message) return null;
  return (
    <View style={styles.message}>
      <Text variant="body" color="danger" accessibilityRole="alert">
        {detail.message}
      </Text>
      {detail.message.includes("Settings") ? (
        <Button label="Open Settings" variant="secondary" onPress={() => Linking.openSettings()} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { paddingHorizontal: space.sm, flexDirection: "row", justifyContent: "space-between" },
  right: { flexDirection: "row", gap: space.xs },
  action: { paddingHorizontal: gutter, paddingTop: space.sm },
  message: { gap: space.md, alignItems: "flex-start" },
});

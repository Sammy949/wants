import { Platform, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDelete } from "@/components/delete-provider";
import { Icon } from "@/components/icon";
import { TagCard } from "@/components/tag-card";
import { Text } from "@/components/text";
import type { Want } from "@/data/wants";
import { useTheme } from "@/theme/theme";
import { gutter, minTouch, radius, space } from "@/theme/tokens";
import { wantActions, type WantAction } from "./actions";

function Row({ action, last }: { action: WantAction; last: boolean }) {
  const { colors } = useTheme();
  const tint = action.destructive ? "danger" : "ink";
  return (
    <Pressable
      onPress={action.run}
      accessibilityRole="button"
      accessibilityLabel={action.label}
      style={({ pressed }) => [
        styles.row,
        !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
        pressed && { backgroundColor: colors.press },
      ]}
    >
      <Icon icon={action.icon} size={22} color={tint} />
      <Text variant="body" color={tint} style={styles.label}>
        {action.label}
      </Text>
    </Pressable>
  );
}

/**
 * The actions for a want, opened by long-pressing it on the list. Shows the
 * want at the top so it's clear what the actions apply to, then grouped rows.
 * Content-sized form sheet with a View root (see NewWantFlow for why).
 */
export function ActionsSheet({ want }: { want: Want }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { remove } = useDelete();
  const { main, destructive } = wantActions(want, remove);

  return (
    <View style={[styles.root, { backgroundColor: colors.bg, paddingBottom: insets.bottom + space.md }]}>
      {Platform.OS === "android" ? <View style={[styles.handle, { backgroundColor: colors.line }]} /> : null}
      <View pointerEvents="none" accessibilityElementsHidden>
        <TagCard want={want} />
      </View>
      <View style={[styles.group, { backgroundColor: colors.surface }]} accessibilityRole="menu">
        {main.map((a, i) => (
          <Row key={a.key} action={a} last={i === main.length - 1} />
        ))}
      </View>
      <View style={[styles.group, { backgroundColor: colors.surface }]}>
        {destructive.map((a, i) => (
          <Row key={a.key} action={a} last={i === destructive.length - 1} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { paddingHorizontal: gutter, paddingTop: space.xl, gap: space.md },
  handle: { position: "absolute", top: space.sm, alignSelf: "center", width: 36, height: 5, borderRadius: 3 },
  group: { borderRadius: radius.md, overflow: "hidden" },
  row: {
    minHeight: minTouch + 4,
    flexDirection: "row",
    alignItems: "center",
    gap: space.lg,
    paddingHorizontal: space.lg,
  },
  label: { flex: 1 },
});

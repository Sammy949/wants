import { router } from "expo-router";
import { PlusIcon } from "phosphor-react-native/src/icons/Plus";
import { useState } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { Button } from "@/components/button";
import { EmptyState } from "@/components/empty-state";
import { EmptyWantsArt } from "@/components/illustrations";
import { Screen } from "@/components/screen";
import { TabHeader } from "@/components/tab-header";
import { SwipeToDelete } from "@/components/swipe-to-delete";
import { TagCard } from "@/components/tag-card";
import { UndoBar } from "@/components/undo-bar";
import { useUndoableDelete } from "@/components/use-undoable-delete";
import { Text } from "@/components/text";
import { useLiveQuery } from "@/data/provider";
import { useRecoverPendingGot } from "@/data/use-recover-pending-got";
import type { WantKind } from "@/data/wants";
import { useTheme } from "@/theme/theme";
import { gutter, radius, space } from "@/theme/tokens";

const FILTERS: { key: WantKind | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "thing", label: "Things" },
  { key: "goal", label: "Goals" },
  { key: "place", label: "Places" },
];

export default function WantsScreen() {
  // First screen after launch: finish any got that Android interrupted.
  useRecoverPendingGot();
  const { colors } = useTheme();
  const [filter, setFilter] = useState<WantKind | "all">("all");
  const wants = useLiveQuery("wanting", (repo) => repo.listWanting());
  const deletion = useUndoableDelete();

  // Wants waiting out their Undo window are already gone from the user's view.
  const visible = (wants.data ?? []).filter((w) => !deletion.pendingIds.has(w.id));
  const list = visible.filter((w) => filter === "all" || w.kind === filter);
  const loaded = wants.data !== undefined;
  const empty = loaded && visible.length === 0;

  return (
    <Screen padded={false}>
      <TabHeader title="Wants" />

      {empty ? (
        <EmptyState
          art={<EmptyWantsArt />}
          title="Nothing here yet"
          body="A thing to buy, a goal to hit, a place to go. Write the first one down."
        />
      ) : (
        <>
          <View style={styles.filters} accessibilityRole="tablist">
            {FILTERS.map((f) => {
              const selected = filter === f.key;
              return (
                <Pressable
                  key={f.key}
                  onPress={() => setFilter(f.key)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected }}
                  style={[styles.filter, selected && { backgroundColor: colors.pill }]}
                >
                  <Text variant="label" style={{ color: selected ? colors.onPill : colors.muted }}>
                    {f.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <FlatList
            data={list}
            keyExtractor={(w) => String(w.id)}
            renderItem={({ item }) => (
              <SwipeToDelete label={item.title} onDelete={() => deletion.remove(item.id, item.title)}>
                <TagCard want={item} onPress={() => router.push(`/want/${item.id}`)} />
              </SwipeToDelete>
            )}
            style={styles.listView}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              loaded ? (
                <Text variant="body" color="muted" style={styles.filterEmpty}>
                  No {FILTERS.find((f) => f.key === filter)!.label.toLowerCase()} here yet.
                </Text>
              ) : undefined
            }
          />
        </>
      )}

      {deletion.lastTitle ? <UndoBar message={`Deleted ${deletion.lastTitle}`} onUndo={deletion.undo} /> : null}

      {/* Full-width and pinned above the tab bar in every state, empty included:
          the main action, always in the same place and in thumb reach. */}
      <View style={styles.action}>
        <Button label="New want" icon={PlusIcon} block onPress={() => router.push("/want/new")} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  filters: { flexDirection: "row", gap: space.xs, paddingHorizontal: gutter - space.md, marginBottom: space.md },
  // Same padding selected or not, so labels don't shift when the pill moves.
  filter: { minHeight: 36, paddingHorizontal: space.md, borderRadius: radius.lg, justifyContent: "center" },
  listView: { flex: 1 },
  list: { paddingHorizontal: gutter, paddingBottom: space.lg },
  filterEmpty: { paddingTop: space.xl },
  action: { paddingHorizontal: gutter, paddingTop: space.sm, paddingBottom: space.md },
});

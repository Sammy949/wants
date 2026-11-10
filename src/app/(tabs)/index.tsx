import { router } from "expo-router";
import { PlusIcon } from "phosphor-react-native/src/icons/Plus";
import { useState } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "@/components/button";
import { EmptyState } from "@/components/empty-state";
import { EmptyWantsArt } from "@/components/illustrations";
import { Screen } from "@/components/screen";
import { TagCard } from "@/components/tag-card";
import { Text } from "@/components/text";
import { useLiveQuery } from "@/data/provider";
import type { WantKind } from "@/data/wants";
import { useTheme } from "@/theme/theme";
import { gutter, space } from "@/theme/tokens";

const FILTERS: { key: WantKind | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "thing", label: "Things" },
  { key: "goal", label: "Goals" },
  { key: "place", label: "Places" },
];

export default function WantsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<WantKind | "all">("all");
  const wants = useLiveQuery("wanting", (repo) => repo.listWanting());
  const stats = useLiveQuery("stats", (repo) => repo.stats());

  const list = (wants.data ?? []).filter((w) => filter === "all" || w.kind === filter);
  const loaded = wants.data !== undefined;
  const empty = loaded && wants.data!.length === 0;

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <Text variant="display" accessibilityRole="header">
          Wants
        </Text>
        {stats.data && !empty ? (
          <Text variant="meta" style={styles.count}>
            <Text variant="meta" color="ink" style={styles.countNumber}>
              {stats.data.wanting}
            </Text>{" "}
            wanting{"\n"}
            <Text variant="meta" color="ink" style={styles.countNumber}>
              {stats.data.gotThisYear}
            </Text>{" "}
            got this year
          </Text>
        ) : null}
      </View>

      {empty ? (
        <EmptyState
          art={<EmptyWantsArt />}
          title="Nothing here yet"
          body="A thing to buy, a goal to hit, a place to go. Write the first one down."
          action={<Button label="New want" icon={PlusIcon} onPress={() => router.push("/want/new")} />}
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
                  hitSlop={8}
                  style={styles.filter}
                >
                  <Text variant={selected ? "label" : "body"} color={selected ? "ink" : "muted"} style={styles.filterText}>
                    {f.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <FlatList
            data={list}
            keyExtractor={(w) => String(w.id)}
            renderItem={({ item }) => <TagCard want={item} onPress={() => router.push(`/want/${item.id}`)} />}
            ItemSeparatorComponent={() => <View style={{ height: space.md }} />}
            contentContainerStyle={[styles.list, { paddingBottom: 96 }]}
            ListEmptyComponent={
              loaded ? (
                <Text variant="body" color="muted" style={styles.filterEmpty}>
                  No {FILTERS.find((f) => f.key === filter)!.label.toLowerCase()} yet.
                </Text>
              ) : undefined
            }
          />
          <View style={[styles.fab, { right: Math.max(gutter, insets.right) }]}>
            <View style={[styles.fabShadow, { shadowColor: colors.ink }]}>
              <Button label="New want" icon={PlusIcon} onPress={() => router.push("/want/new")} />
            </View>
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: gutter,
    marginBottom: space.lg,
    gap: space.md,
  },
  count: { textAlign: "right", paddingBottom: 3 },
  countNumber: { fontWeight: "600", fontVariant: ["tabular-nums"] },
  filters: { flexDirection: "row", gap: space.xl, paddingHorizontal: gutter, marginBottom: space.md },
  filter: { minHeight: 32, justifyContent: "center" },
  filterText: { fontSize: 15 },
  list: { paddingHorizontal: gutter },
  filterEmpty: { paddingTop: space.xl },
  fab: { position: "absolute", bottom: space.lg },
  // Tight, directional, ink-tinted: just enough to lift the button off the list.
  fabShadow: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 3,
    borderRadius: 14,
  },
});

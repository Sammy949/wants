import { router } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";
import { Button } from "@/components/button";
import { useDelete } from "@/components/delete-provider";
import { EmptyState } from "@/components/empty-state";
import { EmptyGotArt } from "@/components/illustrations";
import { PhotoTile } from "@/components/photo-tile";
import { Screen } from "@/components/screen";
import { TabHeader } from "@/components/tab-header";
import { UndoBar } from "@/components/undo-bar";
import { useLiveQuery } from "@/data/provider";
import { gutter, space } from "@/theme/tokens";

export default function GotScreen() {
  const got = useLiveQuery("got", (repo) => repo.listGot());
  const deletion = useDelete();
  // Hidden while their Undo window runs.
  const items = (got.data ?? []).filter((w) => !deletion.pendingIds.has(w.id));
  const [first, ...rest] = items;

  return (
    <Screen padded={false}>
      <TabHeader title="Got" />

      {got.data !== undefined && items.length === 0 ? (
        <EmptyState
          art={<EmptyGotArt />}
          title="Nothing got yet"
          body="When you get something, open it and tap I got it. Its photo lands here."
          action={<Button label="See your wants" variant="secondary" onPress={() => router.navigate("/")} />}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.grid}>
          {first ? (
            <PhotoTile want={first} style={styles.hero} onPress={() => router.push(`/want/${first.id}`)} />
          ) : null}
          <View style={styles.rows}>
            {rest.map((w) => (
              <PhotoTile key={w.id} want={w} style={styles.cell} onPress={() => router.push(`/want/${w.id}`)} />
            ))}
          </View>
        </ScrollView>
      )}
      {deletion.lastTitle ? <UndoBar message={`Deleted ${deletion.lastTitle}`} onUndo={deletion.undo} /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { paddingHorizontal: gutter, paddingBottom: space.xxxl, gap: space.md },
  hero: { width: "100%", aspectRatio: 4 / 3 },
  rows: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: space.md },
  // Two columns: half the row minus half the gap.
  cell: { width: "48.3%", aspectRatio: 3 / 4 },
});

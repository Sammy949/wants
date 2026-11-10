import { router } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";
import { PhotoTile } from "@/components/photo-tile";
import { Screen } from "@/components/screen";
import { Text } from "@/components/text";
import { useLiveQuery } from "@/data/provider";
import { gutter, space } from "@/theme/tokens";

export default function GotScreen() {
  const got = useLiveQuery("got", (repo) => repo.listGot());
  const stats = useLiveQuery("stats", (repo) => repo.stats());
  const items = got.data ?? [];
  const [first, ...rest] = items;

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <Text variant="display" accessibilityRole="header">
          Got
        </Text>
        {stats.data && items.length > 0 ? (
          <Text variant="meta" style={styles.count}>
            <Text variant="meta" color="ink" style={styles.countNumber}>
              {stats.data.gotThisYear}
            </Text>{" "}
            this year{"\n"}
            <Text variant="meta" color="ink" style={styles.countNumber}>
              {stats.data.got}
            </Text>{" "}
            all time
          </Text>
        ) : null}
      </View>

      {got.data !== undefined && items.length === 0 ? (
        <View style={styles.empty}>
          <Text variant="heading">Nothing got yet.</Text>
          <Text variant="body" color="muted" style={styles.emptyBody}>
            When you get something, open it and tap I got it. Its photo ends up here.
          </Text>
        </View>
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
  grid: { paddingHorizontal: gutter, paddingBottom: space.xxxl, gap: space.md },
  hero: { width: "100%", aspectRatio: 4 / 3 },
  rows: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: space.md },
  // Two columns: half the row minus half the gap.
  cell: { width: "48.3%", aspectRatio: 3 / 4 },
  empty: { paddingHorizontal: gutter, paddingTop: space.xxxl, gap: space.md },
  emptyBody: { maxWidth: 320 },
});

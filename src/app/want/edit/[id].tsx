import { router, useLocalSearchParams } from "expo-router";
import { View } from "react-native";
import { Text } from "@/components/text";
import { WantForm } from "@/components/want-form";
import { useLiveQuery, useWantsRepo } from "@/data/provider";
import { useTheme } from "@/theme/theme";
import { gutter, space } from "@/theme/tokens";

export default function EditWantSheet() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const wantId = Number(id);
  const { colors } = useTheme();
  const repo = useWantsRepo();
  const { data: want } = useLiveQuery(`want:${wantId}`, (r) => r.get(wantId));

  if (want === undefined) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  if (want === null) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, padding: gutter, paddingTop: space.xxl }}>
        <Text variant="heading">This want isn&apos;t here any more.</Text>
      </View>
    );
  }

  const isGot = want.gotAt !== null;

  return (
    <WantForm
      heading="Edit want"
      showPaid={isGot}
      initial={{ title: want.title, kind: want.kind, price: want.price, note: want.note ?? "", paid: want.paid }}
      onSubmit={async ({ title, kind, price, note, paid }) => {
        await repo.update(wantId, {
          title,
          kind,
          price,
          note,
          // Fields this form doesn't show yet are carried over unchanged.
          category: want.category,
          targetDate: want.targetDate,
          referencePhoto: want.referencePhoto,
        });
        if (isGot) await repo.setPaid(wantId, paid);
        router.back();
      }}
    />
  );
}

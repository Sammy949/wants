import { useLocalSearchParams } from "expo-router";
import { View } from "react-native";
import { ActionsSheet } from "@/components/want-actions/actions-sheet";
import { useLiveQuery } from "@/data/provider";
import { useTheme } from "@/theme/theme";

export default function WantActionsSheet() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { data: want } = useLiveQuery(`want:${id}`, (r) => r.get(Number(id)));
  if (!want) return <View style={{ height: 120, backgroundColor: colors.bg }} />;
  return <ActionsSheet want={want} />;
}

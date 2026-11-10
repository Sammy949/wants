import { router } from "expo-router";
import { GearSixIcon } from "phosphor-react-native/src/icons/GearSix";
import { StyleSheet, View } from "react-native";
import { gutter, space } from "@/theme/tokens";
import { IconButton } from "./button";
import { Text } from "./text";

/** Big tab title with the settings gear at the top right. */
export function TabHeader({ title }: { title: string }) {
  return (
    <View style={styles.header}>
      <Text variant="display" accessibilityRole="header">
        {title}
      </Text>
      <IconButton icon={GearSixIcon} accessibilityLabel="Settings" onPress={() => router.push("/settings")} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingLeft: gutter,
    // The icon button carries its own touch padding; line its glyph up with the gutter.
    paddingRight: gutter - 12,
    marginBottom: space.lg,
  },
});

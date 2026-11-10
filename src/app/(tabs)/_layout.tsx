import { Tabs } from "expo-router";
import { ImagesIcon } from "phosphor-react-native/src/icons/Images";
import { TagIcon } from "phosphor-react-native/src/icons/Tag";
import { useTheme } from "@/theme/theme";

export default function TabLayout() {
  const { colors } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.bg, borderTopColor: colors.line },
        tabBarLabelStyle: { fontSize: 12, fontWeight: "600" },
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Wants",
          tabBarIcon: ({ color, focused }) => <TagIcon color={color as string} size={24} weight={focused ? "fill" : "regular"} />,
        }}
      />
      <Tabs.Screen
        name="got"
        options={{
          title: "Got",
          tabBarIcon: ({ color, focused }) => <ImagesIcon color={color as string} size={24} weight={focused ? "fill" : "regular"} />,
        }}
      />
    </Tabs>
  );
}

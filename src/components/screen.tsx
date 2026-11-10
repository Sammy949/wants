import type { PropsWithChildren } from "react";
import { View, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/theme/theme";
import { gutter, space } from "@/theme/tokens";

interface ScreenProps extends PropsWithChildren {
  /** Apply the side gutter. Lists that handle their own padding can turn it off. */
  padded?: boolean;
  style?: ViewStyle;
}

/** Full-height themed surface that clears the status bar / notch. */
export function Screen({ children, padded = true, style }: ScreenProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        {
          flex: 1,
          backgroundColor: colors.bg,
          paddingTop: insets.top + space.md,
          paddingLeft: padded ? Math.max(gutter, insets.left) : insets.left,
          paddingRight: padded ? Math.max(gutter, insets.right) : insets.right,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

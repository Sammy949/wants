import type { IconProps as PhosphorProps } from "phosphor-react-native";
import type { ComponentType } from "react";
import { View } from "react-native";
import { useTheme } from "@/theme/theme";
import type { ColorName } from "@/theme/tokens";

export type PhosphorIcon = ComponentType<PhosphorProps>;

interface IconProps {
  /**
   * Import icons one by one from "phosphor-react-native/src/icons/<Name>".
   * The package index pulls in all ~1500 icons, which bloats the bundle.
   */
  icon: PhosphorIcon;
  size?: number;
  color?: ColorName;
  weight?: PhosphorProps["weight"];
}

/** Decorative by default: give the surrounding control the accessibility label. */
export function Icon({ icon: IconComponent, size = 24, color = "ink", weight = "regular" }: IconProps) {
  const { colors } = useTheme();
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" pointerEvents="none">
      <IconComponent size={size} color={colors[color]} weight={weight} />
    </View>
  );
}

import { Pressable, StyleSheet, View, type PressableProps } from "react-native";
import { useTheme } from "@/theme/theme";
import { minTouch, radius, space, type ColorName } from "@/theme/tokens";
import { Icon, type PhosphorIcon } from "./icon";
import { Text } from "./text";

type Variant = "primary" | "secondary" | "plain" | "danger";

interface ButtonProps extends Omit<PressableProps, "children" | "style"> {
  label: string;
  variant?: Variant;
  icon?: PhosphorIcon;
  /** Stretch to the container width. */
  block?: boolean;
}

const looks: Record<Variant, { bg: ColorName | null; fg: ColorName }> = {
  primary: { bg: "ink", fg: "bg" },
  secondary: { bg: "surface", fg: "ink" },
  plain: { bg: null, fg: "ink" },
  danger: { bg: null, fg: "danger" },
};

/**
 * Pressed state is a tonal change, never a scale or lift.
 */
export function Button({ label, variant = "primary", icon, block, disabled, ...rest }: ButtonProps) {
  const { colors } = useTheme();
  const look = looks[variant];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        block && styles.block,
        { backgroundColor: look.bg ? colors[look.bg] : "transparent" },
        disabled && styles.disabled,
        pressed && (look.bg === "ink" ? styles.pressedSolid : { backgroundColor: colors.press }),
      ]}
      {...rest}
    >
      <View style={styles.row}>
        {icon ? <Icon icon={icon} size={18} color={look.fg} weight="bold" /> : null}
        <Text variant="label" color={look.fg}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

interface IconButtonProps extends Omit<PressableProps, "children" | "style"> {
  icon: PhosphorIcon;
  /** Required: icon-only controls need a spoken name. */
  accessibilityLabel: string;
  color?: ColorName;
}

export function IconButton({ icon, color = "ink", ...rest }: IconButtonProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      hitSlop={4}
      style={({ pressed }) => [styles.iconButton, pressed && { backgroundColor: colors.press }]}
      {...rest}
    >
      <Icon icon={icon} color={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: minTouch,
    paddingHorizontal: space.xl,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
  },
  block: { alignSelf: "stretch" },
  row: { flexDirection: "row", alignItems: "center", gap: space.sm },
  disabled: { opacity: 0.4 },
  pressedSolid: { opacity: 0.85 },
  iconButton: {
    width: minTouch,
    height: minTouch,
    borderRadius: minTouch / 2,
    alignItems: "center",
    justifyContent: "center",
  },
});

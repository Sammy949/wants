import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from "react-native";
import { useTheme } from "@/theme/theme";
import { fonts, type ColorName } from "@/theme/tokens";

const variants = {
  /** Screen titles. */
  display: { fontFamily: fonts.display600, fontSize: 34, lineHeight: 40 },
  /** Section and sheet headings. */
  heading: { fontFamily: fonts.display600, fontSize: 22, lineHeight: 28 },
  /** Want names. */
  title: { fontFamily: fonts.display500, fontSize: 18, lineHeight: 24 },
  body: { fontSize: 16, lineHeight: 22 },
  label: { fontSize: 15, lineHeight: 20, fontWeight: "600" },
  meta: { fontSize: 13, lineHeight: 18 },
  /** Money and counts: system font for ₦ and tabular digits. */
  number: { fontSize: 16, lineHeight: 22, fontWeight: "600", fontVariant: ["tabular-nums"] },
} satisfies Record<string, TextStyle>;

export type TextVariant = keyof typeof variants;

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  color?: ColorName;
}

export function Text({ variant = "body", color, style, ...rest }: TextProps) {
  const { colors } = useTheme();
  const defaultColor: ColorName = variant === "meta" ? "muted" : "ink";
  return (
    <RNText
      // Display sizes still scale with the user's text size, but capped so headings don't wrap into stacks.
      maxFontSizeMultiplier={variant === "display" || variant === "heading" ? 1.4 : undefined}
      style={[variants[variant], { color: colors[color ?? defaultColor] }, style]}
      {...rest}
    />
  );
}

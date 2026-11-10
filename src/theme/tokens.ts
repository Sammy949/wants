/**
 * Fern palette. Contrast measured 2026-11-10 (WCAG):
 * muted on surface >= 5.3, danger on bg >= 6.5, button text on ink >= 15.
 * Accent is tonal and used sparingly: the "got" state and small highlights.
 */
export const palettes = {
  light: {
    bg: "#f3f5f1",
    surface: "#e6ebe3",
    ink: "#15211a",
    muted: "#536158",
    accent: "#2e5b44",
    danger: "#9b3426",
    /** Hairline separation; ink at low alpha so it sits in the palette. */
    line: "rgba(21, 33, 26, 0.10)",
    /** Pressed-state overlay. */
    press: "rgba(21, 33, 26, 0.06)",
    /** Selected filter pill: white with ink text. */
    pill: "#ffffff",
    onPill: "#15211a",
  },
  dark: {
    bg: "#0e1411",
    surface: "#18211c",
    ink: "#e4eae3",
    muted: "#97a69c",
    accent: "#a8c9b4",
    danger: "#eea493",
    line: "rgba(228, 234, 227, 0.10)",
    press: "rgba(228, 234, 227, 0.08)",
    /** Selected filter pill: near-white with near-black text, same as light. */
    pill: "#e4eae3",
    onPill: "#0e1411",
  },
} as const;

export type Palette = { [K in keyof (typeof palettes)["light"]]: string };
export type ColorName = keyof Palette;

/**
 * Display face is Sora, loaded per weight so Android and iOS both pick the
 * exact file (fontWeight on a custom family is unreliable on Android).
 * Body text uses the system font: SF Pro / Roboto both carry ₦ and tabular digits.
 */
export const fonts = {
  display400: "Sora_400Regular",
  display500: "Sora_500Medium",
  display600: "Sora_600SemiBold",
  display700: "Sora_700Bold",
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 40,
} as const;

/** Screen side gutter. */
export const gutter = space.xl;

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
} as const;

/** Minimum touch target (iOS 44pt, Android 48dp; use the larger). */
export const minTouch = 48;

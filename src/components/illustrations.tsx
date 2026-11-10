import Svg, { Circle, G, Path, Rect } from "react-native-svg";
import { useTheme } from "@/theme/theme";
import { tagPath } from "./tag-shape";

/**
 * Empty-state illustrations. One house style: ink outlines with round joins,
 * surface fills, accent on one element only, and the app's own tag shape.
 * Built from theme colours so they follow light and dark mode.
 * Previewed as PNGs in both themes before shipping (scratch renders, not kept).
 */

const VIEWBOX = "0 0 240 180";

interface ArtProps {
  width?: number;
}

/** A blank tag hanging from a nail: a want you haven't written yet. */
export function EmptyWantsArt({ width = 220 }: ArtProps) {
  const { colors } = useTheme();
  return (
    <Svg width={width} height={(width * 3) / 4} viewBox={VIEWBOX} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <G transform="translate(120 62) rotate(97) translate(-17 -33)">
        <Path
          d={tagPath(108, 66)}
          fill={colors.surface}
          fillRule="evenodd"
          stroke={colors.ink}
          strokeWidth={2.5}
          strokeLinejoin="round"
        />
        <Path d="M 52 20 V 46 M 72 20 V 38" stroke={colors.muted} strokeWidth={2.5} strokeLinecap="round" opacity={0.55} />
      </G>
      <Path
        d="M 120 22 L 115 59.5 M 120 22 L 125 60.5"
        stroke={colors.ink}
        strokeWidth={1.8}
        strokeLinecap="round"
        fill="none"
      />
      <Circle cx={120} cy={20} r={4.5} fill={colors.ink} />
    </Svg>
  );
}

/** An empty photo frame with the got stamp on its corner: where your photos will go. */
export function EmptyGotArt({ width = 220 }: ArtProps) {
  const { colors } = useTheme();
  return (
    <Svg width={width} height={(width * 3) / 4} viewBox={VIEWBOX} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Rect x={52} y={22} width={136} height={118} rx={14} fill={colors.surface} stroke={colors.ink} strokeWidth={2.5} />
      <Rect
        x={64}
        y={34}
        width={112}
        height={94}
        rx={8}
        fill="none"
        stroke={colors.muted}
        strokeWidth={2}
        strokeDasharray="6 7"
        strokeLinecap="round"
        opacity={0.6}
      />
      <G transform="translate(140 124) rotate(-14) scale(0.72) translate(-56 -26)">
        <Path
          d={tagPath(112, 52)}
          fill={colors.accent}
          fillRule="evenodd"
          stroke={colors.ink}
          strokeWidth={3.2}
          strokeLinejoin="round"
        />
        <Path
          d="M 50 27 L 60 37 L 80 17"
          stroke={colors.bg}
          strokeWidth={6}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </G>
    </Svg>
  );
}

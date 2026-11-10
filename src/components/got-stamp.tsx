import { useEffect } from "react";
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import { gotHaptic } from "@/lib/haptics";
import { useTheme } from "@/theme/theme";
import { tagPath } from "./tag-shape";

const AnimatedPath = Animated.createAnimatedComponent(Path);

// Drawn at 2x in the viewBox so the tag's notch and hole keep their proportions small.
const VB_W = 112;
const VB_H = 52;
const CHECK = "M 50 27 L 60 37 L 80 17";
// Two strokes of the check: hypot(10,10) + hypot(20,20) ≈ 42.4, rounded up.
const CHECK_LENGTH = 44;

// A stamp lands with a little give, unlike UI that should settle dead still.
const STAMP_SPRING = { dampingRatio: 0.6, duration: 480 };

interface GotStampProps {
  /**
   * Play the stamp-down motion and the got haptic. False renders it at rest.
   * The haptic fires here, on the same frame the motion starts, so touch and
   * sight agree (Apple's harmony rule). It still fires under Reduce Motion.
   */
  celebrate: boolean;
  size?: number;
}

/**
 * The "got" mark: the want's tag, filled and checked.
 * At rest it's fully drawn. When celebrating it starts large and springs down
 * onto the page while the check draws itself in.
 */
export function GotStamp({ celebrate, size = 56 }: GotStampProps) {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const rotate = useSharedValue(0);
  const dash = useSharedValue(0);

  useEffect(() => {
    if (!celebrate) return;
    gotHaptic();
    if (reduceMotion) return;
    scale.set(1.7);
    rotate.set(-10);
    dash.set(CHECK_LENGTH);
    scale.set(withSpring(1, STAMP_SPRING));
    rotate.set(withSpring(0, STAMP_SPRING));
    dash.set(withDelay(140, withTiming(0, { duration: 280, easing: Easing.out(Easing.cubic) })));
  }, [celebrate, reduceMotion, scale, rotate, dash]);

  const stampStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.get() }, { rotate: `${rotate.get()}deg` }],
  }));

  const checkProps = useAnimatedProps(() => ({ strokeDashoffset: dash.get() }));

  return (
    <Animated.View style={stampStyle} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width={size} height={(size * VB_H) / VB_W} viewBox={`0 0 ${VB_W} ${VB_H}`}>
        <Path d={tagPath(VB_W, VB_H)} fill={colors.accent} fillRule="evenodd" />
        <AnimatedPath
          d={CHECK}
          stroke={colors.bg}
          strokeWidth={6}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          strokeDasharray={CHECK_LENGTH}
          animatedProps={checkProps}
        />
      </Svg>
    </Animated.View>
  );
}

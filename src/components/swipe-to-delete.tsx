import { TrashIcon } from "phosphor-react-native/src/icons/Trash";
import { useState, type PropsWithChildren } from "react";
import { StyleSheet, View, type LayoutChangeEvent } from "react-native";
import { GestureDetector, usePanGesture } from "react-native-gesture-handler";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import { scheduleOnRN } from "react-native-worklets";
import { useTheme } from "@/theme/theme";
import { space } from "@/theme/tokens";
import { Icon } from "./icon";
import { tagPath } from "./tag-shape";

/** How far past which a release removes the row (fraction of its width). */
const COMMIT_FRACTION = 0.4;
const RETURN_SPRING = { dampingRatio: 0.85, duration: 380 };

/** Apple's momentum projection, so a quick flick counts as a full swipe. */
function project(velocity: number, decelerationRate = 0.998) {
  "worklet";
  return ((velocity / 1000) * decelerationRate) / (1 - decelerationRate);
}

interface SwipeToDeleteProps extends PropsWithChildren {
  /** Called once the row has slid away and collapsed. The caller hides it and offers Undo. */
  onDelete: () => void;
  /** Spoken name of the row, for the delete action label. */
  label: string;
  /** Space below the row; collapses with it so the list closes up smoothly. */
  gap?: number;
}

/**
 * Swipe a row left to remove it, Gmail style: no button waits behind the card.
 * As the card moves, a red layer in the exact tag silhouette shows underneath
 * with a trash icon. Past ~40% (or a flick) the card slides off and the row
 * collapses; otherwise it springs back. The layer is invisible at rest, so
 * nothing ever peeks out (not even through the tag's punched hole).
 *
 * Horizontal drags only: vertical movement fails the gesture so the list scrolls.
 * Screen readers get a Delete action on the row instead.
 */
export function SwipeToDelete({ children, onDelete, label, gap = space.md }: SwipeToDeleteProps) {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const width = useSharedValue(0);
  const rowHeight = useSharedValue(0);
  const x = useSharedValue(0);
  // -1 means "natural height"; set to the measured height when collapsing starts.
  const height = useSharedValue(-1);
  const bottom = useSharedValue(gap);
  const dragStart = useSharedValue(0);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width: w, height: h } = e.nativeEvent.layout;
    width.set(w);
    rowHeight.set(h);
    if (!size || size.w !== w || size.h !== h) setSize({ w, h });
  };

  const pan = usePanGesture({
    // Start only on a clear horizontal drag; a vertical one belongs to the list.
    activeOffsetX: [-14, 14],
    failOffsetY: [-10, 10],
    onActivate: () => {
      "worklet";
      dragStart.set(x.get());
    },
    onUpdate: (e) => {
      "worklet";
      // Left only. Dragging right just resists a little.
      const next = dragStart.get() + e.translationX;
      x.set(next < 0 ? next : next * 0.15);
    },
    onDeactivate: (e) => {
      "worklet";
      const w = width.get();
      const projected = x.get() + project(e.velocityX);
      if (projected >= -w * COMMIT_FRACTION) {
        x.set(withSpring(0, { ...RETURN_SPRING, velocity: e.velocityX }));
        return;
      }
      if (reduceMotion) {
        scheduleOnRN(onDelete);
        return;
      }
      // Slide off, then collapse the row (and its gap) so the list closes up.
      x.set(
        withTiming(-w - 24, { duration: 200 }, (slid) => {
          if (!slid) return;
          height.set(rowHeight.get());
          height.set(withTiming(0, { duration: 200 }));
          bottom.set(
            withTiming(0, { duration: 200 }, (collapsed) => {
              if (collapsed) scheduleOnRN(onDelete);
            }),
          );
        }),
      );
    },
  });

  const rowStyle = useAnimatedStyle(() => ({
    marginBottom: bottom.get(),
    ...(height.get() >= 0 ? { height: height.get(), overflow: "hidden" as const } : {}),
  }));
  const cardStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.get() }] }));
  const underlayStyle = useAnimatedStyle(() => ({
    // Fully transparent until the card has moved, so nothing shows at rest.
    opacity: interpolate(-x.get(), [0, 12, 40], [0, 0, 1], Extrapolation.CLAMP),
  }));
  const iconStyle = useAnimatedStyle(() => {
    const armed = -x.get() > width.get() * COMMIT_FRACTION;
    return { transform: [{ scale: withTiming(armed ? 1.15 : 1, { duration: 120 }) }] };
  });

  return (
    <Animated.View style={rowStyle}>
      <View onLayout={onLayout}>
        <Animated.View style={[StyleSheet.absoluteFill, underlayStyle]} pointerEvents="none">
          {size ? (
            <Svg width={size.w} height={size.h} style={StyleSheet.absoluteFill}>
              <Path d={tagPath(size.w, size.h)} fill={colors.danger} fillRule="evenodd" />
            </Svg>
          ) : null}
          <Animated.View style={[styles.icon, iconStyle]}>
            <Icon icon={TrashIcon} size={24} color="bg" weight="bold" />
          </Animated.View>
        </Animated.View>

        <GestureDetector gesture={pan}>
          <Animated.View
            style={cardStyle}
            accessibilityActions={[{ name: "delete", label: "Delete" }]}
            onAccessibilityAction={(e) => e.nativeEvent.actionName === "delete" && onDelete()}
            accessibilityHint={`Swipe left to delete ${label}`}
          >
            {children}
          </Animated.View>
        </GestureDetector>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  icon: { position: "absolute", right: space.xl, top: 0, bottom: 0, justifyContent: "center" },
});

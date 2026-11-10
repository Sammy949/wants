import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type PropsWithChildren,
  type ReactNode,
} from "react";
import { BackHandler, Pressable, StyleSheet, useWindowDimensions, View, type LayoutChangeEvent } from "react-native";
import { GestureDetector, usePanGesture } from "react-native-gesture-handler";
import { useReanimatedKeyboardAnimation } from "react-native-keyboard-controller";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  Extrapolation,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";
import { useTheme } from "@/theme/theme";
import { space } from "@/theme/tokens";

/**
 * Our own bottom drawer, identical on iOS and Android.
 *
 * Why not the native formSheet: on iOS its content container is laid out
 * differently from Android (see notes/debugging.md), which made the form
 * overlap the header and, once clipped, stop rendering. Here the layout is
 * plain React Native, so both platforms run the same code.
 *
 * Motion follows Apple's fluid-interface rules: springs that start from the
 * current position (interruptible), 1:1 drag, release velocity handed to the
 * spring, momentum projection to decide close vs. return, and rubber-banding
 * when dragged past the top.
 */

const OPEN_SPRING = { dampingRatio: 1, duration: 420 };
const RETURN_SPRING = { dampingRatio: 0.85, duration: 380 };
const CLOSE_SPRING = { dampingRatio: 1, duration: 320, overshootClamping: true };

/** Apple's momentum projection (Designing Fluid Interfaces). */
function project(velocity: number, decelerationRate = 0.998) {
  "worklet";
  return ((velocity / 1000) * decelerationRate) / (1 - decelerationRate);
}

/** Progressive resistance past a boundary instead of a hard stop. */
function rubberband(overshoot: number, dimension: number, constant = 0.55) {
  "worklet";
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}

interface DrawerContextValue {
  /** Animate the drawer away, then call onDismiss. */
  close: () => void;
  pan: ReturnType<typeof usePanGesture> | null;
}

const DrawerContext = createContext<DrawerContextValue>({ close: () => {}, pan: null });

export function useDrawer() {
  return useContext(DrawerContext);
}

/**
 * The drawer's grab area: the handle plus whatever header you put inside.
 * Dragging anywhere in here moves the drawer.
 */
export function DrawerGrab({ children }: { children?: ReactNode }) {
  const { colors } = useTheme();
  const { close, pan } = useDrawer();
  const content = (
    <View>
      <Pressable onPress={close} accessibilityRole="button" accessibilityLabel="Close" style={styles.handleArea}>
        <View style={[styles.handle, { backgroundColor: colors.muted }]} />
      </Pressable>
      {children}
    </View>
  );
  return pan ? <GestureDetector gesture={pan}>{content}</GestureDetector> : content;
}

interface DrawerProps extends PropsWithChildren {
  /** Called once the drawer is fully off screen. Usually router.back(). */
  onDismiss: () => void;
  accessibilityLabel: string;
}

export function Drawer({ children, onDismiss, accessibilityLabel }: DrawerProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const keyboard = useReanimatedKeyboardAnimation();
  const reduceMotion = useReducedMotion();

  // translateY of the panel: 0 = fully open, panelHeight = fully hidden.
  const offset = useSharedValue(screenHeight);
  const panelHeight = useSharedValue(0);
  const opened = useSharedValue(false);
  const dragStart = useSharedValue(0);

  const close = useCallback(() => {
    if (reduceMotion) {
      onDismiss();
      return;
    }
    offset.set(withSpring(panelHeight.get() + insets.bottom + 24, CLOSE_SPRING, (finished) => {
      if (finished) scheduleOnRN(onDismiss);
    }));
  }, [insets.bottom, offset, onDismiss, panelHeight, reduceMotion]);

  // Android back closes with the same motion instead of popping instantly.
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      close();
      return true;
    });
    return () => sub.remove();
  }, [close]);

  const onLayout = (e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    panelHeight.set(h);
    if (!opened.get()) {
      opened.set(true);
      if (reduceMotion) {
        offset.set(0);
      } else {
        offset.set(h);
        offset.set(withSpring(0, OPEN_SPRING));
      }
    }
  };

  const pan = usePanGesture({
    activeOffsetY: [-8, 8],
    onActivate: () => {
      "worklet";
      // Start from wherever the panel is right now, even mid-animation.
      dragStart.set(offset.get());
    },
    onUpdate: (e) => {
      "worklet";
      const next = dragStart.get() + e.translationY;
      offset.set(next >= 0 ? next : -rubberband(-next, panelHeight.get()));
    },
    onDeactivate: (e) => {
      "worklet";
      const projected = offset.get() + project(e.velocityY);
      if (projected > panelHeight.get() * 0.5) {
        offset.set(withSpring(
          panelHeight.get() + insets.bottom + 24,
          { ...CLOSE_SPRING, velocity: e.velocityY },
          (finished) => {
            if (finished) scheduleOnRN(onDismiss);
          },
        ));
      } else {
        offset.set(withSpring(0, { ...RETURN_SPRING, velocity: e.velocityY }));
      }
    },
  });

  const panelStyle = useAnimatedStyle(() => ({
    // keyboard.height is negative while the keyboard is up, so this lifts the panel.
    transform: [{ translateY: offset.get() + keyboard.height.get() }],
    // Shrink with the keyboard so the top never leaves the screen.
    maxHeight: screenHeight - insets.top - space.lg + keyboard.height.get(),
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(offset.get(), [0, Math.max(panelHeight.get(), 1)], [1, 0], Extrapolation.CLAMP),
  }));

  const context = useMemo(() => ({ close, pan }), [close, pan]);

  return (
    <DrawerContext.Provider value={context}>
      <View style={StyleSheet.absoluteFill}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={close}
            accessibilityRole="button"
            accessibilityLabel="Close"
          />
        </Animated.View>

        <Animated.View
          onLayout={onLayout}
          accessibilityViewIsModal
          accessibilityLabel={accessibilityLabel}
          style={[styles.panel, { backgroundColor: colors.bg, paddingBottom: insets.bottom }, panelStyle]}
        >
          {children}
        </Animated.View>
      </View>
    </DrawerContext.Provider>
  );
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: "rgba(0, 0, 0, 0.4)" },
  panel: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  handleArea: { alignItems: "center", paddingTop: space.sm, paddingBottom: space.xs },
  handle: { width: 36, height: 5, borderRadius: 3, opacity: 0.5 },
});

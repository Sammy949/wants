import { TrashIcon } from "phosphor-react-native/src/icons/Trash";
import { useRef, type PropsWithChildren } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Swipeable, { type SwipeableMethods } from "react-native-gesture-handler/ReanimatedSwipeable";
import Animated, { Extrapolation, interpolate, useAnimatedStyle, type SharedValue } from "react-native-reanimated";
import { useTheme } from "@/theme/theme";
import { space } from "@/theme/tokens";
import { Icon } from "./icon";
import { TAG } from "./tag-shape";
import { Text } from "./text";

const ACTION_WIDTH = 88;
const GAP = space.sm;

/**
 * The revealed Delete. Same height and corner radius as the tag card it sits
 * behind, and fully transparent until the swipe starts, so nothing of it shows
 * past the card's rounded corners while the row is closed.
 */
function DeleteAction({ progress, onPress, label }: { progress: SharedValue<number>; onPress: () => void; label: string }) {
  const { colors } = useTheme();
  const reveal = useAnimatedStyle(() => ({
    opacity: interpolate(progress.get(), [0, 0.25, 0.6], [0, 0, 1], Extrapolation.CLAMP),
  }));
  return (
    <Animated.View style={[styles.actionWrap, reveal]}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Delete ${label}`}
        style={({ pressed }) => [styles.action, { backgroundColor: colors.danger, opacity: pressed ? 0.85 : 1 }]}
      >
        <Icon icon={TrashIcon} size={22} color="bg" weight="bold" />
        <Text variant="meta" style={{ color: colors.bg, fontWeight: "600" }}>
          Delete
        </Text>
      </Pressable>
    </Animated.View>
  );
}

/** Shared across rows so opening one closes the one that was open. */
let openRow: SwipeableMethods | null = null;

interface SwipeToDeleteProps extends PropsWithChildren {
  onDelete: () => void;
  /** Spoken name of the row, for the delete action label. */
  label: string;
}

/**
 * Swipe a row left to reveal Delete, as in Mail or Messages. Tapping Delete
 * deletes straight away: the swipe plus the tap are already two deliberate steps.
 * Screen reader users get the same action from the row's actions menu.
 */
export function SwipeToDelete({ children, onDelete, label }: SwipeToDeleteProps) {
  const self = useRef<SwipeableMethods>(null);

  return (
    <Swipeable
      ref={self}
      friction={1.6}
      rightThreshold={ACTION_WIDTH / 2}
      overshootRight={false}
      onSwipeableWillOpen={() => {
        if (openRow && openRow !== self.current) openRow.close();
        openRow = self.current;
      }}
      onSwipeableClose={() => {
        if (openRow === self.current) openRow = null;
      }}
      renderRightActions={(progress, _translation, methods) => (
        <DeleteAction
          progress={progress}
          label={label}
          onPress={() => {
            methods.close();
            onDelete();
          }}
        />
      )}
    >
      <View
        accessibilityActions={[{ name: "delete", label: "Delete" }]}
        onAccessibilityAction={(e) => e.nativeEvent.actionName === "delete" && onDelete()}
      >
        {children}
      </View>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  // Full row height; the gap separates it from the card once revealed.
  actionWrap: { width: ACTION_WIDTH, paddingLeft: GAP },
  action: {
    flex: 1,
    borderRadius: TAG.cornerR,
    alignItems: "center",
    justifyContent: "center",
    gap: space.xs,
  },
});

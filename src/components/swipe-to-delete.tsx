import { TrashIcon } from "phosphor-react-native/src/icons/Trash";
import { useRef, type PropsWithChildren } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Swipeable, { type SwipeableMethods } from "react-native-gesture-handler/ReanimatedSwipeable";
import { useTheme } from "@/theme/theme";
import { radius, space } from "@/theme/tokens";
import { Icon } from "./icon";
import { Text } from "./text";

const ACTION_WIDTH = 88;

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
  const { colors } = useTheme();
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
      renderRightActions={(_progress, _translation, methods) => (
        <View style={styles.actionWrap}>
          <Pressable
            onPress={() => {
              methods.close();
              onDelete();
            }}
            accessibilityRole="button"
            accessibilityLabel={`Delete ${label}`}
            style={({ pressed }) => [styles.action, { backgroundColor: colors.danger, opacity: pressed ? 0.85 : 1 }]}
          >
            <Icon icon={TrashIcon} size={22} color="bg" weight="bold" />
            <Text variant="meta" style={{ color: colors.bg, fontWeight: "600" }}>
              Delete
            </Text>
          </Pressable>
        </View>
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
  actionWrap: { width: ACTION_WIDTH, paddingLeft: space.sm },
  action: {
    flex: 1,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    gap: space.xs,
  },
});

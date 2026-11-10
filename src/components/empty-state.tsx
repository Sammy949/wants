import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { gutter, space } from "@/theme/tokens";
import { Text } from "./text";

interface EmptyStateProps {
  art: ReactNode;
  title: string;
  body: string;
  action?: ReactNode;
}

/** Illustration, one line of heading, one of explanation, and the next step. */
export function EmptyState({ art, title, body, action }: EmptyStateProps) {
  return (
    <View style={styles.wrap}>
      {art}
      <View style={styles.text}>
        <Text variant="heading" style={styles.center}>
          {title}
        </Text>
        <Text variant="body" color="muted" style={styles.center}>
          {body}
        </Text>
      </View>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: gutter,
    paddingBottom: space.xxxl * 2,
    gap: space.xl,
  },
  text: { gap: space.sm, maxWidth: 300 },
  center: { textAlign: "center" },
});

import { Image } from "expo-image";
import { Pressable, StyleSheet, View, type ViewStyle } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { photoUri } from "@/data/photos";
import type { Want } from "@/data/wants";
import { formatDay } from "@/lib/dates";
import { useTheme } from "@/theme/theme";
import { radius, space } from "@/theme/tokens";
import { Text } from "./text";

interface PhotoTileProps {
  want: Want;
  onPress?: () => void;
  style?: ViewStyle;
}

/**
 * A got want. With a proof photo it's the photo with a caption on a scrim
 * that only sits behind the text; without one it's a plain tonal tile.
 */
export function PhotoTile({ want, onPress, style }: PhotoTileProps) {
  const { colors } = useTheme();
  const day = want.gotAt ? formatDay(want.gotAt) : "";
  const hasPhoto = !!want.proofPhoto;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${want.title}, got ${day}`}
      style={({ pressed }) => [
        styles.tile,
        { backgroundColor: hasPhoto ? colors.surface : colors.accent },
        pressed && styles.pressed,
        style,
      ]}
    >
      {hasPhoto ? (
        <>
          <Image source={{ uri: photoUri(want.proofPhoto!) }} style={StyleSheet.absoluteFill} contentFit="cover" />
          <Svg style={styles.scrim} width="100%" height="100%" preserveAspectRatio="none">
            <Defs>
              <LinearGradient id="scrim" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#000" stopOpacity="0" />
                <Stop offset="0.45" stopColor="#000" stopOpacity="0.28" />
                <Stop offset="1" stopColor="#000" stopOpacity="0.6" />
              </LinearGradient>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#scrim)" />
          </Svg>
        </>
      ) : null}
      <View style={styles.caption}>
        <Text variant="title" numberOfLines={2} style={{ color: hasPhoto ? "#ffffff" : colors.bg }}>
          {want.title}
        </Text>
        <Text variant="meta" style={{ color: hasPhoto ? "rgba(255,255,255,0.9)" : colors.bg, opacity: hasPhoto ? 1 : 0.85 }}>
          {day}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    borderRadius: radius.md,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  pressed: { opacity: 0.85 },
  scrim: { position: "absolute", left: 0, right: 0, bottom: 0, height: "60%" },
  caption: { padding: space.md, paddingTop: space.xxl, gap: 2 },
});

import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

/**
 * The one haptic in the app: something you wanted is now got.
 * Kept to this single moment so it stays meaningful (Apple's "utility" rule).
 *
 * Android uses the system Confirm haptic, which feels native and needs no
 * VIBRATE permission. iOS uses the Success notification pattern.
 * Silent no-ops are fine: iOS skips haptics in Low Power Mode, and some
 * Android devices lack Confirm.
 */
export function gotHaptic(): void {
  const play =
    Platform.OS === "android"
      ? Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Confirm)
      : Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  play.catch(() => {
    if (Platform.OS === "android") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
  });
}

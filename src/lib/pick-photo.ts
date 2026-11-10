import * as ImagePicker from "expo-image-picker";

export type PhotoSource = "camera" | "library";

export type PickResult =
  | { status: "picked"; uri: string }
  | { status: "cancelled" }
  /** Camera permission refused. canAskAgain=false means only Settings can fix it. */
  | { status: "denied"; canAskAgain: boolean };

const OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ["images"],
  // 0.8 keeps proof photos sharp but far smaller than full quality.
  quality: 0.8,
};

/**
 * The library uses the system photo picker, which needs no permission.
 * The camera always asks first.
 * The returned URI is in the cache: pass it to savePhoto before storing it.
 */
export async function pickPhoto(source: PhotoSource): Promise<PickResult> {
  if (source === "camera") {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return { status: "denied", canAskAgain: permission.canAskAgain };
  }
  const result =
    source === "camera"
      ? await ImagePicker.launchCameraAsync(OPTIONS)
      : await ImagePicker.launchImageLibraryAsync(OPTIONS);
  if (result.canceled || !result.assets[0]) return { status: "cancelled" };
  return { status: "picked", uri: result.assets[0].uri };
}

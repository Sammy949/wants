import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useEffect } from "react";
import { Platform } from "react-native";
import { deletePhotos, savePhoto } from "./photos";
import { recoverPendingGot } from "./pending-got";
import { pendingGotStore } from "./pending-store";
import { useWantsRepo } from "./provider";

/**
 * On launch, finish a "mark as got" that Android interrupted by killing the app
 * while the camera or picker was open. Runs once; always clears the note.
 * iOS doesn't lose results this way, so there it only clears leftovers.
 */
export function useRecoverPendingGot() {
  const repo = useWantsRepo();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const pending = await pendingGotStore.load();
      if (!pending) return;
      let pickedUri: string | null = null;
      if (Platform.OS === "android") {
        const result = await ImagePicker.getPendingResultAsync().catch(() => null);
        if (result && "canceled" in result && !result.canceled) pickedUri = result.assets[0]?.uri ?? null;
      }
      const outcome = await recoverPendingGot({ pending, pickedUri, repo, savePhoto, deletePhotos });
      await pendingGotStore.clear();
      if (!cancelled && outcome.status === "recovered") {
        router.push(`/want/${outcome.wantId}?got=1`);
      }
    })().catch(() => pendingGotStore.clear());
    return () => {
      cancelled = true;
    };
  }, [repo]);
}

import { router } from "expo-router";
import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";
import { useDelete } from "@/components/delete-provider";
import { deletePhotos, savePhoto } from "@/data/photos";
import { pendingGotStore } from "@/data/pending-store";
import { useLiveQuery, useWantsRepo } from "@/data/provider";
import type { Price } from "@/data/wants";
import { pickPhoto, type PhotoSource } from "@/lib/pick-photo";

/**
 * Everything the want detail screen does, independent of how it looks:
 * load the want, mark it as got (photo + paid), undo, want it again, delete.
 * Layouts only render; behaviour lives here.
 */
export function useWantDetail(wantId: number, { startCelebrating = false, startChoosing = false } = {}) {
  const repo = useWantsRepo();
  const { remove } = useDelete();
  const { data: want, error } = useLiveQuery(`want:${wantId}`, (r) => r.get(wantId));
  const [choosing, setChoosing] = useState(startChoosing);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  // True only right after marking as got on this screen, so the moment plays once.
  const [justGot, setJustGot] = useState(startCelebrating);

  const celebrating = justGot && !!want?.gotAt;
  useEffect(() => {
    if (celebrating) AccessibilityInfo.announceForAccessibility("Marked as got.");
  }, [celebrating]);

  async function markGot(source: PhotoSource | null, paid: Price | null) {
    setMessage(null);
    let saved: string | null = null;
    try {
      if (source) {
        // If Android kills the app while the picker is open, this note lets the
        // next launch finish the job (see data/pending-got.ts).
        // A safety net only: failing to write it must not block marking.
        await pendingGotStore.save({ wantId, paid, startedAt: new Date().toISOString() }).catch(() => {});
        const picked = await pickPhoto(source).finally(() => pendingGotStore.clear().catch(() => {}));
        if (picked.status === "cancelled") return;
        if (picked.status === "denied") {
          setMessage(
            picked.canAskAgain
              ? "wants needs the camera to take the photo."
              : "Camera access is off for wants. Turn it on in Settings, or choose a photo instead.",
          );
          return;
        }
        setBusy(true);
        saved = await savePhoto(picked.uri);
      }
      setBusy(true);
      await repo.markGot(wantId, { proofPhoto: saved, paid });
      setChoosing(false);
      setJustGot(true);
    } catch {
      // Don't leave a copied photo behind if the database write failed.
      if (saved) deletePhotos([saved]);
      setMessage("Couldn't save that. Try again.");
    } finally {
      setBusy(false);
    }
  }

  /**
   * Undo is only offered right after marking, for a mistaken tap. A want that
   * was really got stays got; wanting it again makes a new want.
   */
  async function undoGot() {
    setJustGot(false);
    try {
      const { removedPhoto } = await repo.unmarkGot(wantId);
      if (removedPhoto) deletePhotos([removedPhoto]);
      AccessibilityInfo.announceForAccessibility("Moved back to wants.");
    } catch {
      setMessage("Couldn't undo that. Try again.");
    }
  }

  /** A fresh want with the same details. The got one keeps its photo and date. */
  async function wantAgain() {
    if (!want) return;
    try {
      const again = await repo.create({
        title: want.title,
        kind: want.kind,
        price: want.price,
        note: want.note,
        category: want.category,
        targetDate: null,
      });
      router.replace(`/want/${again.id}`);
    } catch {
      setMessage("Couldn't add it again. Try again.");
    }
  }

  /** Delete with Undo (shown on the list) instead of an "are you sure" alert. */
  function deleteWant() {
    if (!want) return;
    remove(want.id, want.title);
    router.back();
  }

  return {
    want,
    missing: !!error || want === null,
    choosing,
    setChoosing,
    busy,
    message,
    justGot,
    celebrating,
    markGot,
    undoGot,
    wantAgain,
    deleteWant,
    edit: () => router.push(`/want/edit/${wantId}`),
  };
}

export type WantDetail = ReturnType<typeof useWantDetail>;

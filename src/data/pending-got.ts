import type { Price, WantsRepo } from "./wants";

/**
 * Android can kill the app's activity while the camera or photo picker is open
 * (low memory, or "Don't keep activities" in developer options). When the app
 * comes back, JS state is gone: we no longer know which want was being marked.
 *
 * So before opening the picker we save a small "pending got" note, and on the
 * next launch ImagePicker.getPendingResultAsync() hands back the photo that
 * would otherwise be lost. recoverPendingGot pairs the two and finishes the job.
 */

export interface PendingGot {
  wantId: number;
  paid: Price | null;
  /** ISO timestamp, to ignore notes left over from long ago. */
  startedAt: string;
}

/** The async-storage-shaped API of expo-sqlite/kv-store, narrowed for tests. */
export interface KeyValue {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

const KEY = "pending-got";

export function createPendingGotStore(kv: KeyValue) {
  return {
    save: (pending: PendingGot) => kv.setItem(KEY, JSON.stringify(pending)),
    clear: () => kv.removeItem(KEY),
    async load(): Promise<PendingGot | null> {
      const raw = await kv.getItem(KEY);
      if (!raw) return null;
      try {
        const value = JSON.parse(raw) as PendingGot;
        return typeof value.wantId === "number" && typeof value.startedAt === "string" ? value : null;
      } catch {
        return null;
      }
    },
  };
}

export type PendingGotStore = ReturnType<typeof createPendingGotStore>;

/** A note older than this is from an abandoned attempt, not a killed activity. */
export const PENDING_MAX_AGE_MS = 60 * 60 * 1000;

export type RecoveryOutcome =
  | { status: "recovered"; wantId: number }
  | { status: "skipped"; reason: "no-note" | "no-photo" | "stale" | "missing" | "already-got" | "failed" };

interface RecoverArgs {
  pending: PendingGot | null;
  /** URI from getPendingResultAsync, or null if there was nothing or it was cancelled. */
  pickedUri: string | null;
  repo: Pick<WantsRepo, "get" | "markGot">;
  savePhoto: (uri: string) => Promise<string>;
  deletePhotos: (names: string[]) => void;
  now?: Date;
}

export async function recoverPendingGot({
  pending,
  pickedUri,
  repo,
  savePhoto,
  deletePhotos,
  now = new Date(),
}: RecoverArgs): Promise<RecoveryOutcome> {
  if (!pending) return { status: "skipped", reason: "no-note" };
  if (!pickedUri) return { status: "skipped", reason: "no-photo" };
  if (now.getTime() - new Date(pending.startedAt).getTime() > PENDING_MAX_AGE_MS) {
    return { status: "skipped", reason: "stale" };
  }
  const want = await repo.get(pending.wantId);
  if (!want) return { status: "skipped", reason: "missing" };
  if (want.gotAt) return { status: "skipped", reason: "already-got" };

  let saved: string | null = null;
  try {
    saved = await savePhoto(pickedUri);
    await repo.markGot(pending.wantId, { proofPhoto: saved, paid: pending.paid });
    return { status: "recovered", wantId: pending.wantId };
  } catch {
    if (saved) deletePhotos([saved]);
    return { status: "skipped", reason: "failed" };
  }
}

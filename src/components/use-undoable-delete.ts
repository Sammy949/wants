import { useEffect, useState } from "react";
import { deletePhotos } from "@/data/photos";
import { useWantsRepo } from "@/data/provider";
import { createDeleteQueue, type QueueSnapshot } from "@/lib/delete-queue";

/**
 * Delete wants with a 5 second Undo. Deleted wants are hidden straight away
 * (filter by pendingIds) and only removed from the database once the window
 * passes. Leaving the screen commits anything still pending.
 */
export function useUndoableDelete() {
  const repo = useWantsRepo();
  const [snapshot, setSnapshot] = useState<QueueSnapshot<string>>({ pendingIds: [], last: null });
  // Created once; lives as long as the screen.
  const [queue] = useState(() =>
    createDeleteQueue<string>({
      commit: (id) => {
        repo
          .remove(id)
          .then(deletePhotos)
          .catch(() => {});
      },
      onChange: setSnapshot,
    }),
  );

  useEffect(() => () => queue.flush(), [queue]);

  return {
    remove: (id: number, title: string) => queue.add(id, title),
    undo: () => queue.undoLast(),
    pendingIds: new Set(snapshot.pendingIds),
    lastTitle: snapshot.last?.item ?? null,
  };
}

import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import { deletePhotos } from "@/data/photos";
import { useWantsRepo } from "@/data/provider";
import { createDeleteQueue, type QueueSnapshot } from "@/lib/delete-queue";

interface DeleteContextValue {
  /** Hide the want now; delete it after the Undo window. */
  remove: (id: number, title: string) => void;
  undo: () => void;
  pendingIds: Set<number>;
  lastTitle: string | null;
}

const DeleteContext = createContext<DeleteContextValue | null>(null);

/**
 * App-wide delete with Undo (Apple: prefer undo to confirmation). Any screen or
 * sheet can delete a want; the Wants list hides pending ones and shows the Undo
 * bar. Deletion commits after 5 seconds; closing the app first deletes nothing.
 */
export function DeleteProvider({ children }: PropsWithChildren) {
  const repo = useWantsRepo();
  const [snapshot, setSnapshot] = useState<QueueSnapshot<string>>({ pendingIds: [], last: null });
  // Created once for the app's lifetime.
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

  const value = useMemo<DeleteContextValue>(
    () => ({
      remove: (id, title) => queue.add(id, title),
      undo: () => {
        queue.undoLast();
      },
      pendingIds: new Set(snapshot.pendingIds),
      lastTitle: snapshot.last?.item ?? null,
    }),
    [queue, snapshot],
  );

  return <DeleteContext.Provider value={value}>{children}</DeleteContext.Provider>;
}

export function useDelete(): DeleteContextValue {
  const value = useContext(DeleteContext);
  if (!value) throw new Error("useDelete must be used inside DeleteProvider");
  return value;
}

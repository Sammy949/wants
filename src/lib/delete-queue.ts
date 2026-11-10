/**
 * Holds deletions for a short grace period so they can be undone, then commits
 * them. If the app is closed before a deletion commits, it simply never
 * happens: the want is still there next launch, which is the safe way to fail.
 */
export interface DeleteQueue<T> {
  /** Hide now, commit after the delay unless undone. */
  add(id: number, item: T): void;
  /** Cancel the most recent pending deletion. Returns it, or null. */
  undoLast(): { id: number; item: T } | null;
  /** Commit everything still pending, now (e.g. when leaving the screen). */
  flush(): void;
  pendingIds(): number[];
  last(): { id: number; item: T } | null;
}

export interface QueueSnapshot<T> {
  pendingIds: number[];
  last: { id: number; item: T } | null;
}

interface Options<T> {
  commit: (id: number, item: T) => void;
  /** Receives a fresh snapshot after every change, for React state. */
  onChange: (snapshot: QueueSnapshot<T>) => void;
  delayMs?: number;
}

export const UNDO_WINDOW_MS = 5000;

export function createDeleteQueue<T>({ commit, onChange, delayMs = UNDO_WINDOW_MS }: Options<T>): DeleteQueue<T> {
  const pending = new Map<number, { item: T; timer: ReturnType<typeof setTimeout> }>();

  function snapshot(): QueueSnapshot<T> {
    const lastId = [...pending.keys()].pop();
    return {
      pendingIds: [...pending.keys()],
      last: lastId === undefined ? null : { id: lastId, item: pending.get(lastId)!.item },
    };
  }
  const changed = () => onChange(snapshot());

  function finish(id: number) {
    const entry = pending.get(id);
    if (!entry) return;
    clearTimeout(entry.timer);
    pending.delete(id);
    commit(id, entry.item);
    changed();
  }

  return {
    add(id, item) {
      if (pending.has(id)) return;
      pending.set(id, { item, timer: setTimeout(() => finish(id), delayMs) });
      changed();
    },
    undoLast() {
      const lastId = [...pending.keys()].pop();
      if (lastId === undefined) return null;
      const entry = pending.get(lastId)!;
      clearTimeout(entry.timer);
      pending.delete(lastId);
      changed();
      return { id: lastId, item: entry.item };
    },
    flush() {
      for (const id of [...pending.keys()]) finish(id);
    },
    pendingIds: () => [...pending.keys()],
    last() {
      const lastId = [...pending.keys()].pop();
      return lastId === undefined ? null : { id: lastId, item: pending.get(lastId)!.item };
    },
  };
}

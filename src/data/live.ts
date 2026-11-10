import type { WantsRepo } from "./wants";

/**
 * Minimal change notification: screens re-run their queries after any write.
 * Owned here rather than expo-sqlite's change listener so it is testable and
 * fires once per logical write, not once per row.
 */
type Listener = () => void;

export function createChangeBus() {
  const listeners = new Set<Listener>();
  return {
    subscribe(listener: Listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    emit() {
      for (const listener of listeners) listener();
    },
  };
}

export type ChangeBus = ReturnType<typeof createChangeBus>;

const WRITES = ["create", "update", "markGot", "setPaid", "unmarkGot", "remove"] as const;

/** Wrap a repo so every successful write emits on the bus. */
export function withNotify(repo: WantsRepo, bus: ChangeBus): WantsRepo {
  const wrapped = { ...repo };
  for (const name of WRITES) {
    const original = repo[name] as (...args: unknown[]) => Promise<unknown>;
    (wrapped as Record<string, unknown>)[name] = async (...args: unknown[]) => {
      const result = await original(...args);
      bus.emit();
      return result;
    };
  }
  return wrapped;
}

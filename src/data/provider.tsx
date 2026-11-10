import { SQLiteProvider, useSQLiteContext, type SQLiteDatabase } from "expo-sqlite";
import { useEffect, useMemo, useState, type PropsWithChildren } from "react";
import { DATABASE_NAME } from "./db";
import { createChangeBus, withNotify } from "./live";
import { migrate } from "./migrations";
import { createWantsRepo, type WantsRepo } from "./wants";

const bus = createChangeBus();

async function init(db: SQLiteDatabase) {
  // WAL must be set outside a transaction, so it runs before migrations.
  await db.execAsync("PRAGMA journal_mode = WAL");
  await migrate(db);
}

export function DataProvider({ children }: PropsWithChildren) {
  return (
    <SQLiteProvider databaseName={DATABASE_NAME} onInit={init}>
      {children}
    </SQLiteProvider>
  );
}

export function useWantsRepo(): WantsRepo {
  const db = useSQLiteContext();
  return useMemo(() => withNotify(createWantsRepo(db), bus), [db]);
}

export interface LiveQuery<T> {
  data: T | undefined;
  error: unknown;
}

/**
 * Run a read and re-run it whenever a write happens anywhere in the app.
 * Pass a stable `key` that changes when the query's inputs change.
 */
export function useLiveQuery<T>(key: string, query: (repo: WantsRepo) => Promise<T>): LiveQuery<T> {
  const repo = useWantsRepo();
  const [version, setVersion] = useState(0);
  const [state, setState] = useState<LiveQuery<T>>({ data: undefined, error: undefined });

  useEffect(() => bus.subscribe(() => setVersion((v) => v + 1)), []);

  useEffect(() => {
    let cancelled = false;
    query(repo).then(
      (data) => !cancelled && setState({ data, error: undefined }),
      (error: unknown) => !cancelled && setState((s) => ({ data: s.data, error })),
    );
    return () => {
      cancelled = true;
    };
    // `query` is expected to change identity each render; `key` captures its inputs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repo, key, version]);

  return state;
}

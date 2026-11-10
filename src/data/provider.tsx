import { SQLiteProvider, useSQLiteContext, type SQLiteDatabase } from "expo-sqlite";
import { useMemo, type PropsWithChildren } from "react";
import { DATABASE_NAME } from "./db";
import { migrate } from "./migrations";
import { createWantsRepo, type WantsRepo } from "./wants";

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
  return useMemo(() => createWantsRepo(db), [db]);
}

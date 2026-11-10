import type { Db, SQLValue } from "./db";

/**
 * Test-only adapter: runs the data layer against Node's built-in SQLite
 * (node:sqlite, Node 22+) so repository logic is tested with a real engine.
 */
export function createTestDb(): Db {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { DatabaseSync } = require("node:sqlite");
  const raw = new DatabaseSync(":memory:");

  const db: Db = {
    async execAsync(source) {
      raw.exec(source);
    },
    async runAsync(source, params: SQLValue[]) {
      const r = raw.prepare(source).run(...params);
      return { lastInsertRowId: Number(r.lastInsertRowid), changes: Number(r.changes) };
    },
    async getFirstAsync<T>(source: string, params: SQLValue[]) {
      return (raw.prepare(source).get(...params) as T | undefined) ?? null;
    },
    async getAllAsync<T>(source: string, params: SQLValue[]) {
      return raw.prepare(source).all(...params) as T[];
    },
    async withTransactionAsync(task) {
      raw.exec("BEGIN");
      try {
        await task();
        raw.exec("COMMIT");
      } catch (e) {
        raw.exec("ROLLBACK");
        throw e;
      }
    },
  };
  return db;
}

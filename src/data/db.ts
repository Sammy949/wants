/**
 * The subset of expo-sqlite's SQLiteDatabase that the data layer uses.
 * Keeping it narrow lets tests run the same code against Node's built-in SQLite.
 */
export type SQLValue = string | number | null;

export interface Db {
  execAsync(source: string): Promise<void>;
  runAsync(source: string, params: SQLValue[]): Promise<{ lastInsertRowId: number; changes: number }>;
  getFirstAsync<T>(source: string, params: SQLValue[]): Promise<T | null>;
  getAllAsync<T>(source: string, params: SQLValue[]): Promise<T[]>;
  withTransactionAsync(task: () => Promise<void>): Promise<void>;
}

export const DATABASE_NAME = "wants.db";

import type { Db } from "./db";

/**
 * Ordered schema migrations. Index 0 takes the database from version 0 to 1.
 * Never edit a migration that has shipped: append a new one.
 */
export const MIGRATIONS: readonly string[] = [
  `
  CREATE TABLE wants (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    title TEXT NOT NULL CHECK (length(trim(title)) > 0),
    kind TEXT NOT NULL CHECK (kind IN ('thing', 'goal', 'place')),
    note TEXT,
    category TEXT,
    price_minor INTEGER CHECK (price_minor IS NULL OR price_minor >= 0),
    currency TEXT,
    target_date TEXT,
    reference_photo TEXT,
    got_at TEXT,
    proof_photo TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    CHECK ((price_minor IS NULL) = (currency IS NULL)),
    CHECK (proof_photo IS NULL OR got_at IS NOT NULL)
  );
  CREATE INDEX wants_wanting ON wants (created_at DESC) WHERE got_at IS NULL;
  CREATE INDEX wants_got ON wants (got_at DESC) WHERE got_at IS NOT NULL;
  `,
];

export async function migrate(db: Db): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>("PRAGMA user_version", []);
  const current = row?.user_version ?? 0;
  if (current > MIGRATIONS.length) {
    throw new Error(
      `Database is at version ${current}, newer than this app supports (${MIGRATIONS.length}).`,
    );
  }
  for (let version = current; version < MIGRATIONS.length; version++) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(MIGRATIONS[version]);
      // PRAGMA cannot take bound parameters; version is an integer we control.
      await db.execAsync(`PRAGMA user_version = ${version + 1}`);
    });
  }
}

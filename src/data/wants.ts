import { isCurrencyCode, type CurrencyCode } from "@/lib/money";
import type { Db, SQLValue } from "./db";

export const WANT_KINDS = ["thing", "goal", "place"] as const;
export type WantKind = (typeof WANT_KINDS)[number];

export const TITLE_MAX = 120;

export interface Price {
  minor: number;
  currency: CurrencyCode;
}

export interface Want {
  id: number;
  title: string;
  kind: WantKind;
  note: string | null;
  category: string | null;
  price: Price | null;
  /** ISO date, YYYY-MM-DD. */
  targetDate: string | null;
  /** File name inside the app's photo directory, not a full URI. */
  referencePhoto: string | null;
  /** ISO timestamp. Null while still wanted. */
  gotAt: string | null;
  proofPhoto: string | null;
  /** What was actually paid, recorded when marked as got. */
  paid: Price | null;
  createdAt: string;
  updatedAt: string;
}

export interface WantInput {
  title: string;
  kind: WantKind;
  note?: string | null;
  category?: string | null;
  price?: Price | null;
  targetDate?: string | null;
  referencePhoto?: string | null;
}

export class WantValidationError extends Error {}

interface WantRow {
  id: number;
  title: string;
  kind: string;
  note: string | null;
  category: string | null;
  price_minor: number | null;
  currency: string | null;
  target_date: string | null;
  reference_photo: string | null;
  got_at: string | null;
  proof_photo: string | null;
  paid_minor: number | null;
  paid_currency: string | null;
  created_at: string;
  updated_at: string;
}

function toPrice(minor: number | null, currency: string | null): Price | null {
  return minor !== null && currency !== null && isCurrencyCode(currency) ? { minor, currency } : null;
}

function validPrice(price: Price): boolean {
  return Number.isSafeInteger(price.minor) && price.minor >= 0 && isCurrencyCode(price.currency);
}

/** What the amount is called for each type of want. */
export const PRICE_LABEL: Record<WantKind, string> = { thing: "Price", place: "Budget", goal: "Cost" };

export interface MarkGotOptions {
  proofPhoto?: string | null;
  paid?: Price | null;
  gotAt?: Date;
}

function toWant(row: WantRow): Want {
  const price = toPrice(row.price_minor, row.currency);
  return {
    id: row.id,
    title: row.title,
    kind: (WANT_KINDS as readonly string[]).includes(row.kind) ? (row.kind as WantKind) : "thing",
    note: row.note,
    category: row.category,
    price,
    targetDate: row.target_date,
    referencePhoto: row.reference_photo,
    gotAt: row.got_at,
    proofPhoto: row.proof_photo,
    paid: toPrice(row.paid_minor, row.paid_currency),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function blankToNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function validate(input: WantInput) {
  const title = input.title.trim();
  if (!title) throw new WantValidationError("Give it a name.");
  if (title.length > TITLE_MAX) throw new WantValidationError(`Keep the name under ${TITLE_MAX} characters.`);
  if (!(WANT_KINDS as readonly string[]).includes(input.kind)) throw new WantValidationError("Unknown kind.");
  const price = input.price ?? null;
  if (price && !validPrice(price)) {
    throw new WantValidationError("That price isn't valid.");
  }
  const targetDate = input.targetDate ?? null;
  if (targetDate !== null && !/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
    throw new WantValidationError("Target date must be YYYY-MM-DD.");
  }
  return {
    title,
    kind: input.kind,
    note: blankToNull(input.note),
    category: blankToNull(input.category),
    priceMinor: price?.minor ?? null,
    currency: price?.currency ?? null,
    targetDate,
    referencePhoto: input.referencePhoto ?? null,
  };
}

export type Clock = () => Date;
const systemClock: Clock = () => new Date();

export function createWantsRepo(db: Db, clock: Clock = systemClock) {
  const now = () => clock().toISOString();

  async function get(id: number): Promise<Want | null> {
    const row = await db.getFirstAsync<WantRow>("SELECT * FROM wants WHERE id = ?", [id]);
    return row ? toWant(row) : null;
  }

  async function mustGet(id: number): Promise<Want> {
    const want = await get(id);
    if (!want) throw new Error(`Want ${id} not found.`);
    return want;
  }

  return {
    get,

    async listWanting(): Promise<Want[]> {
      const rows = await db.getAllAsync<WantRow>(
        "SELECT * FROM wants WHERE got_at IS NULL ORDER BY created_at DESC, id DESC",
        [],
      );
      return rows.map(toWant);
    },

    async listGot(): Promise<Want[]> {
      const rows = await db.getAllAsync<WantRow>(
        "SELECT * FROM wants WHERE got_at IS NOT NULL ORDER BY got_at DESC, id DESC",
        [],
      );
      return rows.map(toWant);
    },

    async create(input: WantInput): Promise<Want> {
      const v = validate(input);
      const ts = now();
      const params: SQLValue[] = [
        v.title, v.kind, v.note, v.category, v.priceMinor, v.currency, v.targetDate, v.referencePhoto, ts, ts,
      ];
      const result = await db.runAsync(
        `INSERT INTO wants (title, kind, note, category, price_minor, currency, target_date, reference_photo, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        params,
      );
      return mustGet(result.lastInsertRowId);
    },

    /**
     * Replace the editable fields. Returns the updated want and the reference
     * photo it no longer uses, so the caller can delete that file.
     */
    async update(id: number, input: WantInput): Promise<{ want: Want; replacedPhoto: string | null }> {
      const before = await mustGet(id);
      const v = validate(input);
      await db.runAsync(
        `UPDATE wants SET title = ?, kind = ?, note = ?, category = ?, price_minor = ?, currency = ?,
         target_date = ?, reference_photo = ?, updated_at = ? WHERE id = ?`,
        [v.title, v.kind, v.note, v.category, v.priceMinor, v.currency, v.targetDate, v.referencePhoto, now(), id],
      );
      const replacedPhoto =
        before.referencePhoto && before.referencePhoto !== v.referencePhoto ? before.referencePhoto : null;
      return { want: await mustGet(id), replacedPhoto };
    },

    /** Mark as got. Photo and paid amount are both optional. */
    async markGot(id: number, options: MarkGotOptions = {}): Promise<Want> {
      const { proofPhoto = null, paid = null, gotAt = clock() } = options;
      const before = await mustGet(id);
      if (before.gotAt) throw new Error("Already marked as got.");
      if (paid && !validPrice(paid)) throw new WantValidationError("That amount isn't valid.");
      await db.runAsync(
        "UPDATE wants SET got_at = ?, proof_photo = ?, paid_minor = ?, paid_currency = ?, updated_at = ? WHERE id = ?",
        [gotAt.toISOString(), proofPhoto, paid?.minor ?? null, paid?.currency ?? null, now(), id],
      );
      return mustGet(id);
    },

    /** Correct what was paid on a want that's already got. Null clears it. */
    async setPaid(id: number, paid: Price | null): Promise<Want> {
      const before = await mustGet(id);
      if (!before.gotAt) throw new Error("Only a got want has a paid amount.");
      if (paid && !validPrice(paid)) throw new WantValidationError("That amount isn't valid.");
      await db.runAsync("UPDATE wants SET paid_minor = ?, paid_currency = ?, updated_at = ? WHERE id = ?", [
        paid?.minor ?? null,
        paid?.currency ?? null,
        now(),
        id,
      ]);
      return mustGet(id);
    },

    /** Move back to wanting. Returns the proof photo that is no longer referenced. */
    async unmarkGot(id: number): Promise<{ want: Want; removedPhoto: string | null }> {
      const before = await mustGet(id);
      await db.runAsync("UPDATE wants SET got_at = NULL, proof_photo = NULL, paid_minor = NULL, paid_currency = NULL, updated_at = ? WHERE id = ?", [
        now(), id,
      ]);
      return { want: await mustGet(id), removedPhoto: before.proofPhoto };
    },

    /** Delete. Returns photo files that are no longer referenced. */
    async remove(id: number): Promise<string[]> {
      const before = await get(id);
      if (!before) return [];
      await db.runAsync("DELETE FROM wants WHERE id = ?", [id]);
      return [before.referencePhoto, before.proofPhoto].filter((p): p is string => p !== null);
    },

    /** Currency of the most recently created priced want, to default the picker. */
    async lastCurrency(): Promise<CurrencyCode | null> {
      const row = await db.getFirstAsync<{ currency: string }>(
        "SELECT currency FROM wants WHERE currency IS NOT NULL ORDER BY created_at DESC, id DESC LIMIT 1",
        [],
      );
      return row && isCurrencyCode(row.currency) ? row.currency : null;
    },

    async stats(year: number = clock().getFullYear()) {
      const counts = await db.getFirstAsync<{ wanting: number; got: number; got_this_year: number }>(
        `SELECT
           SUM(got_at IS NULL) AS wanting,
           SUM(got_at IS NOT NULL) AS got,
           SUM(got_at IS NOT NULL AND substr(got_at, 1, 4) = ?) AS got_this_year
         FROM wants`,
        [String(year)],
      );
      const totals = await db.getAllAsync<{ currency: string; total: number }>(
        `SELECT currency, SUM(price_minor) AS total FROM wants
         WHERE got_at IS NULL AND price_minor IS NOT NULL GROUP BY currency ORDER BY total DESC`,
        [],
      );
      return {
        wanting: counts?.wanting ?? 0,
        got: counts?.got ?? 0,
        gotThisYear: counts?.got_this_year ?? 0,
        stillWanted: totals
          .filter((t) => isCurrencyCode(t.currency))
          .map((t) => ({ minor: t.total, currency: t.currency as CurrencyCode })),
      };
    },
  };
}

export type WantsRepo = ReturnType<typeof createWantsRepo>;

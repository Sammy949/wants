import { MIGRATIONS, migrate } from "./migrations";
import { createTestDb } from "./test-db";
import { createWantsRepo, WantValidationError } from "./wants";

function fixedClock(start = "2026-11-10T09:00:00.000Z") {
  let t = new Date(start).getTime();
  // Each call moves forward one minute so ordering by time is deterministic.
  return () => new Date((t += 60_000));
}

async function setup() {
  const db = createTestDb();
  await migrate(db);
  return { db, repo: createWantsRepo(db, fixedClock()) };
}

describe("migrate", () => {
  it("sets user_version to the latest migration and is idempotent", async () => {
    const db = createTestDb();
    await migrate(db);
    await migrate(db);
    const row = await db.getFirstAsync<{ user_version: number }>("PRAGMA user_version", []);
    expect(row?.user_version).toBe(MIGRATIONS.length);
  });

  it("refuses a database from a newer app version", async () => {
    const db = createTestDb();
    await db.execAsync(`PRAGMA user_version = ${MIGRATIONS.length + 1}`);
    await expect(migrate(db)).rejects.toThrow(/newer than this app supports/);
  });
});

describe("wants repo", () => {
  it("creates a want with trimmed fields", async () => {
    const { repo } = await setup();
    const want = await repo.create({
      title: "  Visit Zanzibar ",
      kind: "place",
      note: "   ",
      price: { minor: 120000000, currency: "NGN" },
      targetDate: "2027-08-01",
    });
    expect(want).toMatchObject({
      title: "Visit Zanzibar",
      kind: "place",
      note: null,
      price: { minor: 120000000, currency: "NGN" },
      targetDate: "2027-08-01",
      gotAt: null,
    });
  });

  it("allows goals with no price", async () => {
    const { repo } = await setup();
    const want = await repo.create({ title: "Run a 10k under 50 minutes", kind: "goal" });
    expect(want.price).toBeNull();
  });

  it.each([
    [{ title: "   ", kind: "thing" as const }, /name/],
    [{ title: "x".repeat(121), kind: "thing" as const }, /120/],
    [{ title: "Desk", kind: "thing" as const, price: { minor: -1, currency: "NGN" as const } }, /price/],
    [{ title: "Desk", kind: "thing" as const, targetDate: "next year" }, /YYYY-MM-DD/],
  ])("rejects invalid input %#", async (input, message) => {
    const { repo } = await setup();
    await expect(repo.create(input)).rejects.toThrow(WantValidationError);
    await expect(repo.create(input)).rejects.toThrow(message);
  });

  it("lists wanting newest first and moves items to got", async () => {
    const { repo } = await setup();
    const a = await repo.create({ title: "A", kind: "thing" });
    const b = await repo.create({ title: "B", kind: "thing" });
    expect((await repo.listWanting()).map((w) => w.title)).toEqual(["B", "A"]);

    const got = await repo.markGot(a.id, "proof-a.jpg");
    expect(got.gotAt).not.toBeNull();
    expect(got.proofPhoto).toBe("proof-a.jpg");
    expect((await repo.listWanting()).map((w) => w.id)).toEqual([b.id]);
    expect((await repo.listGot()).map((w) => w.id)).toEqual([a.id]);
  });

  it("refuses to mark the same want twice", async () => {
    const { repo } = await setup();
    const a = await repo.create({ title: "A", kind: "thing" });
    await repo.markGot(a.id, null);
    await expect(repo.markGot(a.id, null)).rejects.toThrow(/Already/);
  });

  it("unmarking returns the orphaned proof photo", async () => {
    const { repo } = await setup();
    const a = await repo.create({ title: "A", kind: "thing" });
    await repo.markGot(a.id, "proof.jpg");
    const { want, removedPhoto } = await repo.unmarkGot(a.id);
    expect(want.gotAt).toBeNull();
    expect(want.proofPhoto).toBeNull();
    expect(removedPhoto).toBe("proof.jpg");
  });

  it("update reports a replaced reference photo", async () => {
    const { repo } = await setup();
    const a = await repo.create({ title: "A", kind: "thing", referencePhoto: "old.jpg" });
    const { want, replacedPhoto } = await repo.update(a.id, { title: "A2", kind: "thing", referencePhoto: "new.jpg" });
    expect(want.title).toBe("A2");
    expect(replacedPhoto).toBe("old.jpg");
    expect(want.updatedAt > a.updatedAt).toBe(true);
  });

  it("remove returns every photo file to clean up", async () => {
    const { repo } = await setup();
    const a = await repo.create({ title: "A", kind: "thing", referencePhoto: "ref.jpg" });
    await repo.markGot(a.id, "proof.jpg");
    expect((await repo.remove(a.id)).sort()).toEqual(["proof.jpg", "ref.jpg"]);
    expect(await repo.get(a.id)).toBeNull();
    expect(await repo.remove(a.id)).toEqual([]);
  });

  it("computes stats per currency for things still wanted", async () => {
    const { repo } = await setup();
    await repo.create({ title: "Headphones", kind: "thing", price: { minor: 48500000, currency: "NGN" } });
    await repo.create({ title: "Camera", kind: "thing", price: { minor: 159900, currency: "USD" } });
    await repo.create({ title: "Trip", kind: "place", price: { minor: 120000000, currency: "NGN" } });
    const desk = await repo.create({ title: "Desk", kind: "thing", price: { minor: 9000000, currency: "NGN" } });
    await repo.create({ title: "10k", kind: "goal" });
    await repo.markGot(desk.id, null, new Date("2026-10-02T12:00:00Z"));

    const stats = await repo.stats(2026);
    expect(stats).toEqual({
      wanting: 4,
      got: 1,
      gotThisYear: 1,
      stillWanted: [
        { minor: 168500000, currency: "NGN" },
        { minor: 159900, currency: "USD" },
      ],
    });
  });

  it("returns zeroed stats on an empty database", async () => {
    const { repo } = await setup();
    expect(await repo.stats(2026)).toEqual({ wanting: 0, got: 0, gotThisYear: 0, stillWanted: [] });
  });
});

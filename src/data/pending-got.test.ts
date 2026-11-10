import { migrate } from "./migrations";
import { createPendingGotStore, PENDING_MAX_AGE_MS, recoverPendingGot, type KeyValue } from "./pending-got";
import { createTestDb } from "./test-db";
import { createWantsRepo } from "./wants";

function memoryKv(): KeyValue {
  const map = new Map<string, string>();
  return {
    getItem: async (k) => map.get(k) ?? null,
    setItem: async (k, v) => void map.set(k, v),
    removeItem: async (k) => void map.delete(k),
  };
}

async function setup() {
  const db = createTestDb();
  await migrate(db);
  const repo = createWantsRepo(db);
  const want = await repo.create({ title: "Headphones", kind: "thing", price: { minor: 100, currency: "NGN" } });
  const deleted: string[] = [];
  return {
    repo,
    want,
    deleted,
    savePhoto: async () => "saved.jpg",
    deletePhotos: (names: string[]) => void deleted.push(...names),
  };
}

const NOW = new Date("2026-11-10T12:00:00Z");
const pendingFor = (wantId: number, startedAt = "2026-11-10T11:58:00Z") => ({
  wantId,
  paid: { minor: 90, currency: "NGN" as const },
  startedAt,
});

describe("pending got store", () => {
  it("saves, loads and clears", async () => {
    const store = createPendingGotStore(memoryKv());
    expect(await store.load()).toBeNull();
    await store.save(pendingFor(1));
    expect(await store.load()).toEqual(pendingFor(1));
    await store.clear();
    expect(await store.load()).toBeNull();
  });

  it("ignores corrupt data", async () => {
    const kv = memoryKv();
    await kv.setItem("pending-got", "{not json");
    expect(await createPendingGotStore(kv).load()).toBeNull();
  });
});

describe("recoverPendingGot", () => {
  it("marks the want as got with the photo and paid amount", async () => {
    const t = await setup();
    const outcome = await recoverPendingGot({ ...t, pending: pendingFor(t.want.id), pickedUri: "file:///cache/x.jpg", now: NOW });
    expect(outcome).toEqual({ status: "recovered", wantId: t.want.id });
    const after = await t.repo.get(t.want.id);
    expect(after?.proofPhoto).toBe("saved.jpg");
    expect(after?.paid).toEqual({ minor: 90, currency: "NGN" });
  });

  it.each([
    ["no-note", null, "file:///x.jpg"],
    ["no-photo", "pending", null],
  ] as const)("skips with %s", async (reason, pending, pickedUri) => {
    const t = await setup();
    const outcome = await recoverPendingGot({
      ...t,
      pending: pending ? pendingFor(t.want.id) : null,
      pickedUri,
      now: NOW,
    });
    expect(outcome).toEqual({ status: "skipped", reason });
  });

  it("skips a stale note", async () => {
    const t = await setup();
    const old = new Date(NOW.getTime() - PENDING_MAX_AGE_MS - 1000).toISOString();
    const outcome = await recoverPendingGot({ ...t, pending: pendingFor(t.want.id, old), pickedUri: "file:///x.jpg", now: NOW });
    expect(outcome).toEqual({ status: "skipped", reason: "stale" });
  });

  it("skips a deleted or already-got want", async () => {
    const t = await setup();
    expect(
      await recoverPendingGot({ ...t, pending: pendingFor(9999), pickedUri: "file:///x.jpg", now: NOW }),
    ).toEqual({ status: "skipped", reason: "missing" });
    await t.repo.markGot(t.want.id);
    expect(
      await recoverPendingGot({ ...t, pending: pendingFor(t.want.id), pickedUri: "file:///x.jpg", now: NOW }),
    ).toEqual({ status: "skipped", reason: "already-got" });
  });

  it("removes the copied photo if marking fails", async () => {
    const t = await setup();
    const failing = { get: t.repo.get, markGot: async () => Promise.reject(new Error("disk full")) };
    const outcome = await recoverPendingGot({
      ...t,
      repo: failing,
      pending: pendingFor(t.want.id),
      pickedUri: "file:///x.jpg",
      now: NOW,
    });
    expect(outcome).toEqual({ status: "skipped", reason: "failed" });
    expect(t.deleted).toEqual(["saved.jpg"]);
  });
});

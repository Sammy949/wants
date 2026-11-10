import { createChangeBus, withNotify } from "./live";
import { migrate } from "./migrations";
import { createTestDb } from "./test-db";
import { createWantsRepo } from "./wants";

describe("withNotify", () => {
  it("emits after successful writes only", async () => {
    const db = createTestDb();
    await migrate(db);
    const bus = createChangeBus();
    const listener = jest.fn();
    const unsubscribe = bus.subscribe(listener);
    const repo = withNotify(createWantsRepo(db), bus);

    const want = await repo.create({ title: "Desk", kind: "thing" });
    expect(listener).toHaveBeenCalledTimes(1);

    await repo.listWanting();
    expect(listener).toHaveBeenCalledTimes(1);

    await expect(repo.create({ title: " ", kind: "thing" })).rejects.toThrow();
    expect(listener).toHaveBeenCalledTimes(1);

    await repo.markGot(want.id);
    expect(listener).toHaveBeenCalledTimes(2);

    unsubscribe();
    await repo.remove(want.id);
    expect(listener).toHaveBeenCalledTimes(2);
  });
});

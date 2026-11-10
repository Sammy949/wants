import { createDeleteQueue } from "./delete-queue";

describe("delete queue", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  function setup() {
    const committed: number[] = [];
    const onChange = jest.fn();
    const q = createDeleteQueue<string>({ commit: (id) => committed.push(id), onChange, delayMs: 5000 });
    return { q, committed, onChange };
  }

  it("commits after the delay", () => {
    const { q, committed } = setup();
    q.add(1, "Desk");
    expect(q.pendingIds()).toEqual([1]);
    jest.advanceTimersByTime(4999);
    expect(committed).toEqual([]);
    jest.advanceTimersByTime(1);
    expect(committed).toEqual([1]);
    expect(q.pendingIds()).toEqual([]);
  });

  it("undo cancels the most recent deletion only", () => {
    const { q, committed } = setup();
    q.add(1, "Desk");
    q.add(2, "Trip");
    expect(q.last()).toEqual({ id: 2, item: "Trip" });
    expect(q.undoLast()).toEqual({ id: 2, item: "Trip" });
    jest.advanceTimersByTime(5000);
    expect(committed).toEqual([1]);
    expect(q.undoLast()).toBeNull();
  });

  it("flush commits everything pending immediately", () => {
    const { q, committed } = setup();
    q.add(1, "Desk");
    q.add(2, "Trip");
    q.flush();
    expect(committed).toEqual([1, 2]);
    jest.advanceTimersByTime(10000);
    expect(committed).toEqual([1, 2]);
  });

  it("ignores adding the same id twice", () => {
    const { q, committed } = setup();
    q.add(1, "Desk");
    q.add(1, "Desk");
    jest.advanceTimersByTime(5000);
    expect(committed).toEqual([1]);
  });

  it("passes a snapshot on every change", () => {
    const { q, onChange } = setup();
    q.add(1, "Desk");
    expect(onChange).toHaveBeenLastCalledWith({ pendingIds: [1], last: { id: 1, item: "Desk" } });
    q.undoLast();
    expect(onChange).toHaveBeenLastCalledWith({ pendingIds: [], last: null });
    expect(onChange).toHaveBeenCalledTimes(2);
  });
});

import { formatDay, formatTargetDate } from "./dates";

describe("formatTargetDate", () => {
  it("formats month and year without timezone drift", () => {
    expect(formatTargetDate("2027-08-01", "en-GB")).toBe("Aug 2027");
    expect(formatTargetDate("2027-01-01", "en-US")).toBe("Jan 2027");
  });

  it("returns the input when it is not a date", () => {
    expect(formatTargetDate("someday", "en-GB")).toBe("someday");
  });
});

describe("formatDay", () => {
  it("formats a timestamp as day month year", () => {
    // Built from local time so the test holds in any timezone.
    expect(formatDay(new Date(2026, 9, 2, 12).toISOString(), "en-GB")).toBe("2 Oct 2026");
  });

  it("returns empty for garbage", () => {
    expect(formatDay("nope")).toBe("");
  });
});

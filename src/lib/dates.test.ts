import { formatDay, formatTargetDate, fromIsoDate, toIsoDate } from "./dates";

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

describe("toIsoDate / fromIsoDate", () => {
  it("round-trips calendar days, including month and year ends", () => {
    for (const day of ["2026-01-01", "2026-03-29", "2026-10-25", "2026-12-31", "2028-02-29"]) {
      expect(toIsoDate(fromIsoDate(day))).toBe(day);
    }
  });

  it("uses the local date of a picked Date", () => {
    expect(toIsoDate(new Date(2027, 7, 1, 23, 59))).toBe("2027-08-01");
    expect(toIsoDate(new Date(2027, 7, 1, 0, 1))).toBe("2027-08-01");
  });
});

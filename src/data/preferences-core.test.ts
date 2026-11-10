import { parsePreferences } from "./preferences-core";

describe("parsePreferences", () => {
  it("reads valid values", () => {
    expect(parsePreferences({ theme: "dark", currency: "USD" })).toEqual({ theme: "dark", currency: "USD" });
  });

  it("falls back on missing or unknown values", () => {
    expect(parsePreferences({ theme: null, currency: null })).toEqual({ theme: "system", currency: null });
    expect(parsePreferences({ theme: "sepia", currency: "XYZ" })).toEqual({ theme: "system", currency: null });
  });
});

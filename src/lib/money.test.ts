import { CURRENCIES, CURRENCY_INFO, formatMoney, toAmountInput, isCurrencyCode, minorDigits, parseAmount } from "./money";

describe("minorDigits", () => {
  it("knows two-decimal and zero-decimal currencies", () => {
    expect(minorDigits("NGN")).toBe(2);
    expect(minorDigits("USD")).toBe(2);
    expect(minorDigits("JPY")).toBe(0);
  });
});

describe("parseAmount", () => {
  it.each([
    ["1200000", 120000000],
    ["1,200,000", 120000000],
    ["₦1,200,000", 120000000],
    ["  485000  ", 48500000],
    ["19.99", 1999],
    ["19.9", 1990],
    ["19.", 1900],
    [".5", 50],
    ["0", 0],
  ])("parses %p as %p minor units (NGN)", (input, expected) => {
    expect(parseAmount(input, "NGN")).toBe(expected);
  });

  it("uses whole units for zero-decimal currencies", () => {
    expect(parseAmount("1599", "JPY")).toBe(1599);
    expect(parseAmount("1599.5", "JPY")).toBeNull();
  });

  it.each(["", "abc", "-5", "1.234", "1.2.3", "12a", "."])("rejects %p", (input) => {
    expect(parseAmount(input, "NGN")).toBeNull();
  });

  it("rejects amounts too large to store exactly", () => {
    expect(parseAmount("999999999999999999", "NGN")).toBeNull();
  });
});

describe("formatMoney", () => {
  it("drops .00 on whole amounts", () => {
    expect(formatMoney(120000000, "NGN", "en")).toBe("₦1,200,000");
  });

  it("keeps cents when present", () => {
    expect(formatMoney(1999, "USD", "en")).toBe("$19.99");
  });

  it("formats zero-decimal currencies", () => {
    expect(formatMoney(1599, "JPY", "en")).toBe("¥1,599");
  });

  it("round-trips with parseAmount", () => {
    const minor = parseAmount("1,234.5", "EUR")!;
    expect(formatMoney(minor, "EUR", "en")).toBe("€1,234.50");
  });
});

describe("isCurrencyCode", () => {
  it("accepts supported codes only", () => {
    expect(isCurrencyCode("NGN")).toBe(true);
    expect(isCurrencyCode("XYZ")).toBe(false);
  });
});

describe("CURRENCY_INFO", () => {
  it("has a symbol and name for every supported currency", () => {
    for (const code of CURRENCIES) {
      expect(CURRENCY_INFO[code].symbol).toBeTruthy();
      expect(CURRENCY_INFO[code].name).toBeTruthy();
    }
  });
});

describe("toAmountInput", () => {
  it.each([
    [120000000, "NGN", "1200000"],
    [1999, "USD", "19.99"],
    [1905, "USD", "19.05"],
    [1950, "USD", "19.50"],
    [1599, "JPY", "1599"],
    [0, "NGN", "0"],
  ] as const)("turns %p %s into %p", (minor, currency, expected) => {
    expect(toAmountInput(minor, currency)).toBe(expected);
  });

  it("round-trips through parseAmount", () => {
    for (const minor of [0, 1, 99, 100, 123456789]) {
      expect(parseAmount(toAmountInput(minor, "NGN"), "NGN")).toBe(minor);
    }
  });
});

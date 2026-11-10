/**
 * Money is stored as an integer count of the currency's minor unit
 * (kobo, cents) next to an ISO 4217 code. Floats are never stored.
 */

export const CURRENCIES = ["NGN", "USD", "EUR", "GBP", "JPY", "GHS", "KES", "ZAR", "CAD"] as const;
export type CurrencyCode = (typeof CURRENCIES)[number];

/**
 * Fixed labels for the currency picker. Hard-coded rather than read from Intl
 * so they look the same on every engine (Hermes and Node disagree on some).
 */
export const CURRENCY_INFO: Record<CurrencyCode, { symbol: string; name: string }> = {
  NGN: { symbol: "₦", name: "Nigerian naira" },
  USD: { symbol: "$", name: "US dollar" },
  EUR: { symbol: "€", name: "Euro" },
  GBP: { symbol: "£", name: "British pound" },
  JPY: { symbol: "¥", name: "Japanese yen" },
  GHS: { symbol: "GH₵", name: "Ghanaian cedi" },
  KES: { symbol: "KSh", name: "Kenyan shilling" },
  ZAR: { symbol: "R", name: "South African rand" },
  CAD: { symbol: "CA$", name: "Canadian dollar" },
};

export function isCurrencyCode(value: string): value is CurrencyCode {
  return (CURRENCIES as readonly string[]).includes(value);
}

const digitsCache = new Map<string, number>();

/** Number of minor-unit digits, e.g. 2 for NGN, 0 for JPY. */
export function minorDigits(currency: CurrencyCode): number {
  let digits = digitsCache.get(currency);
  if (digits === undefined) {
    digits =
      new Intl.NumberFormat("en", { style: "currency", currency }).resolvedOptions()
        .maximumFractionDigits ?? 2;
    digitsCache.set(currency, digits);
  }
  return digits;
}

/**
 * Parse what someone typed into an amount field.
 * Accepts thousands separators, a leading symbol and surrounding spaces.
 * Returns minor units, or null when the input is not a valid non-negative amount.
 */
export function parseAmount(input: string, currency: CurrencyCode): number | null {
  if (input.includes("-")) return null;
  const cleaned = input.trim().replace(/[\s,]/g, "").replace(/^[^\d.]+/, "");
  if (!/^\d+(\.\d*)?$|^\.\d+$/.test(cleaned)) return null;

  const [whole = "", fraction = ""] = cleaned.split(".");
  const digits = minorDigits(currency);
  if (fraction.length > digits) return null;

  const minor = Number((whole || "0") + fraction.padEnd(digits, "0"));
  if (!Number.isSafeInteger(minor)) return null;
  return minor;
}

function formatter(currency: CurrencyCode, fractionDigits: number, locale?: string) {
  const base = {
    style: "currency" as const,
    currency,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  };
  try {
    // narrowSymbol gives "₦" instead of "NGN" in non-Nigerian locales.
    return new Intl.NumberFormat(locale, { ...base, currencyDisplay: "narrowSymbol" });
  } catch {
    return new Intl.NumberFormat(locale, base);
  }
}

/**
 * Format minor units for display. Whole amounts drop the ".00".
 */
export function formatMoney(minor: number, currency: CurrencyCode, locale?: string): string {
  const digits = minorDigits(currency);
  const factor = 10 ** digits;
  const whole = minor % factor === 0;
  return formatter(currency, whole ? 0 : digits, locale).format(minor / factor);
}

/**
 * Minor units back to what someone would type: no symbol, no separators,
 * decimals only when needed. 120000000 NGN -> "1200000", 1999 USD -> "19.99".
 */
export function toAmountInput(minor: number, currency: CurrencyCode): string {
  const digits = minorDigits(currency);
  if (digits === 0) return String(minor);
  const factor = 10 ** digits;
  const whole = Math.floor(minor / factor);
  const fraction = minor % factor;
  return fraction === 0 ? String(whole) : `${whole}.${String(fraction).padStart(digits, "0")}`;
}

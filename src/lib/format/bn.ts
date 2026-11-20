const BN = "০১২৩৪৫৬৭৮৯";

export const toBnDigits = (n: number | string): string =>
  String(n).replace(/[0-9]/g, (d) => BN[+d]);

const toAsciiDigits = (s: string) => s.replace(/[০-৯]/g, (d) => String(BN.indexOf(d)));

/** Non-negative integer from user input (Bangla/ASCII digits, commas, spaces, leading ৳), else null. */
export function parseAmount(input: string): number | null {
  const s = toAsciiDigits(input).replace(/^\s*৳/, "").replace(/[,\s]/g, "");
  if (!/^\d+$/.test(s)) return null;
  const n = Number(s);
  return Number.isSafeInteger(n) ? n : null;
}

// Round half up to 2 decimals using integer math; returns hundredths.
const hundredths = (n: number, unit: number) => Math.floor((200 * n + unit) / (2 * unit));

function scaled(r: number, suffix: string) {
  const int = Math.floor(r / 100);
  const frac = String(r % 100).padStart(2, "0").replace(/0$/, "");
  return `৳${toBnDigits(frac === "0" || frac === "" ? int : `${int}.${frac}`)} ${suffix}`;
}

export function formatTaka(n: number): string {
  if (!Number.isInteger(n) || n < 0) throw new RangeError(`formatTaka: invalid amount ${n}`);
  if (n < 100_000) {
    const s = String(n);
    return `৳${toBnDigits(s.length > 3 ? `${s.slice(0, -3)},${s.slice(-3)}` : s)}`;
  }
  if (n < 10_000_000) {
    const r = hundredths(n, 100_000);
    if (r < 10_000) return scaled(r, "লাখ");
    // rounds up to 100 lakh: fall through to crore
  }
  return scaled(hundredths(n, 10_000_000), "কোটি");
}

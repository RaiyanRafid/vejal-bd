import { describe, expect, it } from "vitest";
import { formatTaka, parseAmount, toBnDigits } from "@/lib/format/bn";

describe("toBnDigits", () => {
  it("converts ASCII digits only", () => {
    expect(toBnDigits(2025)).toBe("২০২৫");
    expect(toBnDigits("a1,5")).toBe("a১,৫");
  });
});

describe("parseAmount", () => {
  it("parses Bangla and comma amounts", () => {
    expect(parseAmount("৫,০০০")).toBe(5000);
    expect(parseAmount("৳ 5,000")).toBe(5000);
    expect(parseAmount("abc")).toBeNull();
  });
  it("rejects empty, decimals and negatives", () => {
    for (const s of ["", "  ", "12.5", "-5", "৳", "1e3", "5 টাকা"]) expect(parseAmount(s)).toBeNull();
  });
});

describe("formatTaka", () => {
  it("formats lakh and crore", () => {
    expect(formatTaka(5000)).toBe("৳৫,০০০");
    expect(formatTaka(288000)).toBe("৳২.৮৮ লাখ");
    expect(formatTaka(6085800000)).toBe("৳৬০৮.৫৮ কোটি");
  });
  it("groups below one lakh and trims zeros", () => {
    expect(formatTaka(0)).toBe("৳০");
    expect(formatTaka(99999)).toBe("৳৯৯,৯৯৯");
    expect(formatTaka(100000)).toBe("৳১ লাখ");
    expect(formatTaka(300000)).toBe("৳৩ লাখ");
    expect(formatTaka(250000)).toBe("৳২.৫ লাখ");
    expect(formatTaka(10000000)).toBe("৳১ কোটি");
  });
  it("rounds half up to 2 decimals", () => {
    expect(formatTaka(100500)).toBe("৳১.০১ লাখ"); // 1.005 -> 1.01
    expect(formatTaka(100400)).toBe("৳১ লাখ");
    expect(formatTaka(9999999)).toBe("৳১ কোটি"); // 99.99999 lakh carries over
  });
  it("throws on invalid input", () => {
    for (const n of [-1, NaN, 1.5, Infinity]) expect(() => formatTaka(n)).toThrow();
  });
});

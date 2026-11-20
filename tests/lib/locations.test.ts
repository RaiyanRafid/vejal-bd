import { describe, expect, it } from "vitest";
import bd from "@/lib/locations/bd.json";

describe("bd.json", () => {
  it("has the expected districts per division", () => {
    const counts = Object.fromEntries(bd.map((d) => [d.slug, d.districts.length]));
    expect(counts).toEqual({
      dhaka: 13, chattogram: 11, rajshahi: 8, khulna: 10,
      barishal: 6, sylhet: 4, rangpur: 8, mymensingh: 4,
    });
  });
  it("has unique slugs", () => {
    const d = bd.flatMap((x) => x.districts.map((y) => y.slug));
    expect(new Set(d).size).toBe(64);
    expect(new Set(bd.map((x) => x.slug)).size).toBe(8);
  });
});

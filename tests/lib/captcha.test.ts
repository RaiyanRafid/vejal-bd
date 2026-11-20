import { describe, expect, it } from "vitest";
import { getClientIp } from "@/lib/clientip";

const h = (o: Record<string, string>) => new Headers(o);

describe("getClientIp", () => {
  it("prefers cf-connecting-ip, else first x-forwarded-for", () => {
    expect(getClientIp(h({ "cf-connecting-ip": " 1.2.3.4 ", "x-forwarded-for": "9.9.9.9" }))).toBe("1.2.3.4");
    expect(getClientIp(h({ "x-forwarded-for": "5.6.7.8, 9.9.9.9" }))).toBe("5.6.7.8");
  });
  it("unmaps IPv4-mapped IPv6", () => {
    expect(getClientIp(h({ "cf-connecting-ip": "::ffff:10.0.0.1" }))).toBe("10.0.0.1");
  });
  it("collapses IPv6 to its /64", () => {
    const a = getClientIp(h({ "cf-connecting-ip": "2001:db8::1" }));
    expect(a).toBe("2001:0db8:0000:0000::/64");
    expect(getClientIp(h({ "cf-connecting-ip": "2001:db8:0:0:ffff::2" }))).toBe(a);
    expect(getClientIp(h({ "cf-connecting-ip": "2001:DB8:0:1::5" }))).toBe("2001:0db8:0000:0001::/64");
  });
  it("returns unknown for garbage or missing", () => {
    expect(getClientIp(h({ "cf-connecting-ip": "not-an-ip" }))).toBe("unknown");
    expect(getClientIp(h({}))).toBe("unknown");
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ISSUE_FIELDS, MAX_IMAGES, reportInputSchema } from "@/lib/reports/fields";

const common = {
  division: "dhaka", district: "gazipur", entityName: "সাব-রেজিস্ট্রি অফিস",
  incidentMonth: "2026-10",
  description: "এখানে কমপক্ষে বিশ অক্ষরের একটি বিস্তারিত বিবরণ দেওয়া হলো।",
};
const ghushBase = {
  ...common, issueType: "ghush", category: "land", service: "নামজারি",
  amountDemanded: "৫,০০০", outcome: "paid",
};
const vejalBase = {
  ...common, issueType: "vejal", category: "milk", productName: "তরল দুধ",
  adulterationType: "dilution", detection: "test_kit", healthImpact: "none",
};

const paid = (i: object) => (reportInputSchema.parse(i) as { amountPaid?: number }).amountPaid;

beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date("2026-11-21T00:00:00Z")); });
afterEach(() => vi.useRealTimers());

describe("reportInputSchema", () => {
  it("accepts valid reports and normalises", () => {
    const g = reportInputSchema.parse(ghushBase);
    expect(g).toMatchObject({ amountDemanded: 5000, incidentMonth: "2026-10-01" });
    expect(reportInputSchema.safeParse(vejalBase).success).toBe(true);
    expect(MAX_IMAGES).toBe(5);
  });
  it("ghush requires amountDemanded and outcome; vejal requires adulterationType", () => {
    expect(reportInputSchema.safeParse({ ...ghushBase, outcome: undefined }).success).toBe(false);
    expect(reportInputSchema.safeParse({ ...ghushBase, amountDemanded: undefined }).success).toBe(false);
    expect(reportInputSchema.safeParse({ ...vejalBase, adulterationType: undefined }).success).toBe(false);
  });
  it("amount bounds and optional amountPaid", () => {
    expect(reportInputSchema.safeParse({ ...ghushBase, amountDemanded: "0" }).success).toBe(false);
    expect(reportInputSchema.safeParse({ ...ghushBase, amountDemanded: "1000000001" }).success).toBe(false);
    expect(reportInputSchema.safeParse({ ...ghushBase, amountDemanded: "12.5" }).success).toBe(false);
    expect(paid({ ...ghushBase, amountPaid: "" })).toBeUndefined();
    expect(paid({ ...ghushBase, amountPaid: "৩০০০" })).toBe(3000);
  });
  it("rejects a district outside the division, with a Bangla error on district", () => {
    const r = reportInputSchema.safeParse({ ...ghushBase, district: "sylhet" });
    expect(r.success).toBe(false);
    expect(r.error!.issues[0].path).toEqual(["district"]);
    expect(reportInputSchema.safeParse({ ...ghushBase, division: "nope", district: "nope" }).success).toBe(false);
  });
  it("validates incident month", () => {
    for (const m of ["2026-12", "1999-12", "2026-13", "2026-1", "garbage"])
      expect(reportInputSchema.safeParse({ ...ghushBase, incidentMonth: m }).success).toBe(false);
    expect(reportInputSchema.safeParse({ ...ghushBase, incidentMonth: "2026-11" }).success).toBe(true);
    expect(reportInputSchema.safeParse({ ...ghushBase, incidentMonth: "2000-01" }).success).toBe(true);
  });
  it("validates description, entity, upazila, area lengths", () => {
    expect(reportInputSchema.safeParse({ ...ghushBase, description: "ছোট" }).success).toBe(false);
    expect(reportInputSchema.safeParse({ ...ghushBase, description: "ক".repeat(3001) }).success).toBe(false);
    expect(reportInputSchema.safeParse({ ...ghushBase, entityName: " ক " }).success).toBe(false);
    expect(reportInputSchema.safeParse({ ...ghushBase, upazila: "ক".repeat(81) }).success).toBe(false);
    expect(reportInputSchema.safeParse({ ...ghushBase, areaText: "ক".repeat(201) }).success).toBe(false);
    expect(reportInputSchema.parse({ ...ghushBase, entityName: "  অফিস  " }).entityName).toBe("অফিস");
  });
  it("rejects unknown category slugs for each issue type", () => {
    expect(reportInputSchema.safeParse({ ...ghushBase, category: "milk" }).success).toBe(false);
    expect(reportInputSchema.safeParse({ ...vejalBase, category: "land" }).success).toBe(false);
  });
  it("rejects unknown issue type", () => {
    expect(reportInputSchema.safeParse({ ...ghushBase, issueType: "x" }).success).toBe(false);
  });
});

describe("ISSUE_FIELDS", () => {
  it("lists the categories from the spec", () => {
    expect(ISSUE_FIELDS.ghush.categories).toHaveLength(13);
    expect(ISSUE_FIELDS.vejal.categories).toHaveLength(11);
    for (const c of [...ISSUE_FIELDS.ghush.categories, ...ISSUE_FIELDS.vejal.categories])
      expect(c.label.length).toBeGreaterThan(0);
  });
});

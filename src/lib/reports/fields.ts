import { z } from "zod";
import bd from "@/lib/locations/bd.json";
import { parseAmount } from "@/lib/format/bn";

export const MAX_IMAGES = 5;

type Option = { slug: string; label: string };
const opts = (pairs: [string, string][]): Option[] => pairs.map(([slug, label]) => ({ slug, label }));
const slugs = (o: Option[]) => o.map((x) => x.slug) as [string, ...string[]];

export const OFFICE_TYPES = opts([
  ["land", "ভূমি অফিস"], ["passport", "পাসপোর্ট অফিস"], ["brta", "বিআরটিএ"],
  ["traffic_police", "ট্রাফিক পুলিশ"], ["police", "থানা/পুলিশ"], ["hospital", "হাসপাতাল"],
  ["city_corp", "সিটি কর্পোরেশন/পৌরসভা"], ["sub_registry", "সাব-রেজিস্ট্রি অফিস"],
  ["education", "শিক্ষা প্রতিষ্ঠান/অফিস"], ["tax", "কর অফিস"], ["customs", "কাস্টমস"],
  ["accounts", "হিসাব রক্ষণ অফিস"], ["other", "অন্যান্য"],
]);
export const PRODUCT_TYPES = opts([
  ["milk", "দুধ"], ["fish", "মাছ"], ["meat", "মাংস"], ["fruit_veg", "ফল-সবজি"],
  ["oil", "তেল"], ["rice_flour", "চাল-আটা"], ["spices", "মসলা"], ["sweets", "মিষ্টি"],
  ["medicine", "ওষুধ"], ["baby_food", "শিশুখাদ্য"], ["other", "অন্যান্য"],
]);
export const ADULTERATION_TYPES = opts([
  ["formalin", "ফরমালিন"], ["artificial_colour", "কৃত্রিম রং"], ["dilution", "পানি/ভেজাল মেশানো"],
  ["expired_relabelled", "মেয়াদোত্তীর্ণ/লেবেল বদল"], ["fake_product", "নকল পণ্য"], ["other", "অন্যান্য"],
]);
export const DETECTION_METHODS = opts([
  ["look_smell", "দেখে/গন্ধে"], ["test_kit", "টেস্ট কিট"], ["lab_report", "ল্যাব রিপোর্ট"],
  ["got_sick", "অসুস্থ হয়েছি"], ["other", "অন্যান্য"],
]);
export const HEALTH_IMPACTS = opts([
  ["none", "কোনো সমস্যা হয়নি"], ["mild", "সামান্য অসুস্থতা"], ["hospitalised", "হাসপাতালে ভর্তি"],
]);
export const GHUSH_OUTCOMES = opts([
  ["paid", "দিয়েছি"], ["refused", "দিইনি"], ["pending", "বিষয়টি ঝুলে আছে"],
]);

const msg = (m: string) => ({ error: m });
const pick = (o: Option[], m = "একটি বিকল্প বেছে নিন।") => z.enum(slugs(o), msg(m));
const text = (min: number, max: number, label: string) =>
  z.string(msg(`${label} লিখুন।`)).trim()
    .min(min, `${label} কমপক্ষে ${min}টি অক্ষর হতে হবে।`)
    .max(max, `${label} সর্বোচ্চ ${max}টি অক্ষর হতে পারে।`);
const optText = (max: number, label: string) =>
  z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().trim().max(max, `${label} সর্বোচ্চ ${max}টি অক্ষর হতে পারে।`).optional());

// Strings go through parseAmount; empty -> undefined; unparseable stays a string so z.number rejects it.
const amountPre = (v: unknown) =>
  typeof v === "string" ? (parseAmount(v) ?? (v.trim() === "" ? undefined : v)) : v;
const amountNum = z.number(msg("সঠিক টাকার পরিমাণ লিখুন (শুধু পূর্ণসংখ্যা)।"))
  .int(msg("সঠিক টাকার পরিমাণ লিখুন (শুধু পূর্ণসংখ্যা)।"))
  .min(1, "পরিমাণ কমপক্ষে ১ টাকা হতে হবে।")
  .max(1_000_000_000, "পরিমাণ অনেক বেশি; সঠিক পরিমাণ লিখুন।");
const amount = z.preprocess(amountPre, amountNum);
const optAmount = z.preprocess(amountPre, amountNum.optional());

const ghushSchema = z.object({
  category: pick(OFFICE_TYPES, "অফিসের ধরন বেছে নিন।"),
  service: text(2, 120, "কোন সেবা চেয়েছিলেন তা"),
  amountDemanded: amount,
  amountPaid: optAmount,
  outcome: pick(GHUSH_OUTCOMES, "ফলাফল বেছে নিন।"),
});
const vejalSchema = z.object({
  category: pick(PRODUCT_TYPES, "পণ্যের ধরন বেছে নিন।"),
  productName: text(2, 120, "পণ্য/ব্র্যান্ডের নাম"),
  adulterationType: pick(ADULTERATION_TYPES, "ভেজালের ধরন বেছে নিন।"),
  pricePaid: optAmount,
  detection: pick(DETECTION_METHODS, "কীভাবে বুঝলেন তা বেছে নিন।"),
  healthImpact: pick(HEALTH_IMPACTS, "স্বাস্থ্যের প্রভাব বেছে নিন।"),
});

export const ISSUE_FIELDS = {
  ghush: { categories: OFFICE_TYPES, schema: ghushSchema },
  vejal: { categories: PRODUCT_TYPES, schema: vejalSchema },
} as const;

const MIN_MONTH = "2000-01";
const incidentMonth = z.string(msg("ঘটনার মাস বেছে নিন।"))
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "ঘটনার মাস সঠিক নয়।")
  .refine((m) => m >= MIN_MONTH, "ঘটনার মাস ২০০০ সালের আগের হতে পারে না।")
  .refine((m) => m <= new Date().toISOString().slice(0, 7), "ভবিষ্যতের মাস দেওয়া যাবে না।")
  .transform((m) => `${m}-01`);

const commonShape = {
  division: z.string(msg("বিভাগ বেছে নিন।")).refine((s) => bd.some((d) => d.slug === s), "বিভাগ সঠিক নয়।"),
  district: z.string(msg("জেলা বেছে নিন।")),
  upazila: optText(80, "উপজেলা"),
  areaText: optText(200, "এলাকা/ল্যান্ডমার্ক"),
  entityName: text(2, 120, "প্রতিষ্ঠানের নাম"),
  incidentMonth,
  description: text(20, 3000, "বিবরণ"),
};

export const reportInputSchema = z.discriminatedUnion("issueType", [
  z.object({ issueType: z.literal("ghush"), ...commonShape, ...ghushSchema.shape }),
  z.object({ issueType: z.literal("vejal"), ...commonShape, ...vejalSchema.shape }),
]).superRefine((v, ctx) => {
  const ok = bd.find((d) => d.slug === v.division)?.districts.some((x) => x.slug === v.district);
  if (!ok) ctx.addIssue({ code: "custom", path: ["district"], message: "জেলাটি এই বিভাগের মধ্যে নয়।" });
});

export type ReportInput = z.infer<typeof reportInputSchema>;

import { sql } from "drizzle-orm";
import {
  bigint, boolean, check, customType, date, index, integer, jsonb, pgTable, primaryKey,
  real, serial, text, timestamp, unique, uuid,
} from "drizzle-orm/pg-core";

const bytea = customType<{ data: Buffer }>({ dataType: () => "bytea" });
const ts = (name: string) => timestamp(name, { withTimezone: true });
const inList = (col: { name: string }, values: readonly string[]) =>
  sql.raw(`"${col.name}" in (${values.map((v) => `'${v}'`).join(", ")})`);

export const STATUSES = ["pending", "approved", "rejected", "hidden"] as const;
export const REJECT_REASONS = ["spam", "personal_name", "implausible", "duplicate", "other"] as const;
export const ENTITY_KINDS = ["office", "shop", "brand", "other"] as const;
export const ROLES = ["user", "moderator", "admin"] as const;
export const IMAGE_STATUSES = ["pending", "approved", "rejected"] as const;
export const CATEGORY_FIELDS = ["category", "adulteration_type", "detection", "service"] as const;
export const REQUESTER_TYPES = ["government", "legal", "company", "other"] as const;
export const TRANSPARENCY_OUTCOMES = ["no_data_held", "refused", "content_removed", "other"] as const;
export type RequesterType = (typeof REQUESTER_TYPES)[number];
export type TransparencyOutcome = (typeof TRANSPARENCY_OUTCOMES)[number];
export type Status = (typeof STATUSES)[number];
export type RejectReason = (typeof REJECT_REASONS)[number];
export type EntityKind = (typeof ENTITY_KINDS)[number];
export type Role = (typeof ROLES)[number];
export type ImageStatus = (typeof IMAGE_STATUSES)[number];
export type CategoryField = (typeof CATEGORY_FIELDS)[number];

export const issueTypes = pgTable("issue_types", {
  slug: text("slug").primaryKey(),
  nameBn: text("name_bn").notNull(),
  enabled: boolean("enabled").notNull().default(true),
});

export const divisions = pgTable("divisions", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  nameBn: text("name_bn").notNull(),
});

export const districts = pgTable("districts", {
  id: serial("id").primaryKey(),
  divisionId: integer("division_id").notNull().references(() => divisions.id),
  slug: text("slug").notNull().unique(),
  nameBn: text("name_bn").notNull(),
});

export const upazilas = pgTable("upazilas", {
  id: serial("id").primaryKey(),
  districtId: integer("district_id").notNull().references(() => districts.id),
  nameBn: text("name_bn").notNull(),
  slug: text("slug").notNull(),
}, (t) => [unique().on(t.districtId, t.slug)]);

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  issueType: text("issue_type").notNull().references(() => issueTypes.slug),
  field: text("field", { enum: CATEGORY_FIELDS }).notNull(),
  slug: text("slug").notNull(),
  labelBn: text("label_bn").notNull(),
  enabled: boolean("enabled").notNull().default(true),
  sort: integer("sort").notNull().default(0),
}, (t) => [
  unique().on(t.issueType, t.field, t.slug),
  check("categories_field_check", inList(t.field, CATEGORY_FIELDS)),
]);

export const entities = pgTable("entities", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  kind: text("kind", { enum: ENTITY_KINDS }).notNull(),
  approvedReportCount: integer("approved_report_count").notNull().default(0),
  mergedInto: uuid("merged_into"),
}, (t) => [check("entities_kind_check", inList(t.kind, ENTITY_KINDS))]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  pseudonym: text("pseudonym").notNull().unique(),
  usernameHmac: text("username_hmac").notNull().unique(),
  emailHmac: text("email_hmac").unique(),
  keyVersion: integer("key_version").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ROLES }).notNull().default("user"),
  totpSecretEnc: text("totp_secret_enc"),
  mustChangePassword: boolean("must_change_password").notNull().default(false),
  createdAt: ts("created_at").notNull().defaultNow(),
}, (t) => [check("users_role_check", inList(t.role, ROLES))]);

export const reports = pgTable("reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  publicId: text("public_id").notNull().unique(),
  issueType: text("issue_type").notNull().references(() => issueTypes.slug),
  status: text("status", { enum: STATUSES }).notNull().default("pending"),
  rejectReason: text("reject_reason", { enum: REJECT_REASONS }),
  division: text("division").notNull().references(() => divisions.slug),
  district: text("district").notNull().references(() => districts.slug),
  upazila: text("upazila"),
  areaText: text("area_text"),
  entityId: uuid("entity_id").references(() => entities.id),
  incidentMonth: date("incident_month").notNull(),
  description: text("description").notNull(),
  details: jsonb("details").notNull().default({}),
  category: text("category").notNull(),
  amountBdt: bigint("amount_bdt", { mode: "number" }),
  outcome: text("outcome"),
  trackingHash: text("tracking_hash").notNull().unique(),
  idempotencyKey: uuid("idempotency_key").notNull().unique(),
  flags: text("flags").array().notNull().default(sql`'{}'`),
  userId: uuid("user_id").references(() => users.id),
  realWeight: real("real_weight").notNull().default(0),
  fakeWeight: real("fake_weight").notNull().default(0),
  rankScore: real("rank_score").notNull().default(0),
  createdAt: ts("created_at").notNull().defaultNow(),
  reviewedAt: ts("reviewed_at"),
  reviewedBy: uuid("reviewed_by").references(() => users.id),
}, (t) => [
  index("reports_status_created_idx").on(t.status, t.createdAt),
  index("reports_status_division_idx").on(t.status, t.division),
  index("reports_status_issue_category_idx").on(t.status, t.issueType, t.category),
  check("reports_status_check", inList(t.status, STATUSES)),
  check("reports_reject_reason_check", sql`"reject_reason" is null or ${inList(t.rejectReason, REJECT_REASONS)}`),
  check("reports_incident_month_check", sql`extract(day from "incident_month") = 1`),
]);

export const reportImages = pgTable("report_images", {
  id: uuid("id").primaryKey().defaultRandom(),
  reportId: uuid("report_id").notNull().references(() => reports.id, { onDelete: "cascade" }),
  storageKey: text("storage_key").notNull().unique(),
  status: text("status", { enum: IMAGE_STATUSES }).notNull().default("pending"),
  width: integer("width").notNull(),
  height: integer("height").notNull(),
}, (t) => [
  index("report_images_report_idx").on(t.reportId),
  check("report_images_status_check", inList(t.status, IMAGE_STATUSES)),
]);

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  createdAt: ts("created_at").notNull().defaultNow(),
  expiresAt: ts("expires_at").notNull(),
});

export const rateLimits = pgTable("rate_limits", {
  key: text("key").notNull(),
  action: text("action").notNull(),
  windowStart: ts("window_start").notNull(),
  count: integer("count").notNull().default(0),
}, (t) => [primaryKey({ columns: [t.key, t.action, t.windowStart] })]);

export const ipSalts = pgTable("ip_salts", {
  day: date("day").primaryKey(),
  salt: bytea("salt").notNull(),
});

export const ipBlocks = pgTable("ip_blocks", {
  ipHash: text("ip_hash").primaryKey(),
  // Must be <= end of the current UTC day: salts rotate daily.
  until: ts("until").notNull(),
});

export const siteSettings = pgTable("site_settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: ts("updated_at").notNull().defaultNow(),
  updatedBy: uuid("updated_by").references(() => users.id),
});

export const adminAuditLog = pgTable("admin_audit_log", {
  id: serial("id").primaryKey(),
  actorId: uuid("actor_id").references(() => users.id),
  action: text("action").notNull(),
  targetType: text("target_type"),
  targetId: text("target_id"),
  meta: jsonb("meta"),
  createdAt: ts("created_at").notNull().defaultNow(),
}, (t) => [index("admin_audit_log_created_idx").on(t.createdAt)]);

export const transparencyRequests = pgTable("transparency_requests", {
  id: serial("id").primaryKey(),
  receivedAt: date("received_at").notNull(),
  requesterType: text("requester_type", { enum: REQUESTER_TYPES }).notNull(),
  summary: text("summary").notNull(),
  outcome: text("outcome", { enum: TRANSPARENCY_OUTCOMES }).notNull(),
}, (t) => [
  check("transparency_requester_type_check", inList(t.requesterType, REQUESTER_TYPES)),
  check("transparency_outcome_check", inList(t.outcome, TRANSPARENCY_OUTCOMES)),
]);

export type User = typeof users.$inferSelect;
export type Report = typeof reports.$inferSelect;

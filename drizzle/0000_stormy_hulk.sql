CREATE TABLE "admin_audit_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"actor_id" uuid,
	"action" text NOT NULL,
	"target_type" text,
	"target_id" text,
	"meta" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"issue_type" text NOT NULL,
	"field" text NOT NULL,
	"slug" text NOT NULL,
	"label_bn" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "categories_issue_type_field_slug_unique" UNIQUE("issue_type","field","slug"),
	CONSTRAINT "categories_field_check" CHECK ("field" in ('category', 'adulteration_type', 'detection', 'service'))
);
--> statement-breakpoint
CREATE TABLE "districts" (
	"id" serial PRIMARY KEY NOT NULL,
	"division_id" integer NOT NULL,
	"slug" text NOT NULL,
	"name_bn" text NOT NULL,
	CONSTRAINT "districts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "divisions" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name_bn" text NOT NULL,
	CONSTRAINT "divisions_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "entities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"kind" text NOT NULL,
	"approved_report_count" integer DEFAULT 0 NOT NULL,
	"merged_into" uuid,
	CONSTRAINT "entities_slug_unique" UNIQUE("slug"),
	CONSTRAINT "entities_kind_check" CHECK ("kind" in ('office', 'shop', 'brand', 'other'))
);
--> statement-breakpoint
CREATE TABLE "ip_blocks" (
	"ip_hash" text PRIMARY KEY NOT NULL,
	"until" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ip_salts" (
	"day" date PRIMARY KEY NOT NULL,
	"salt" "bytea" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "issue_types" (
	"slug" text PRIMARY KEY NOT NULL,
	"name_bn" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rate_limits" (
	"key" text NOT NULL,
	"action" text NOT NULL,
	"window_start" timestamp with time zone NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "rate_limits_key_action_window_start_pk" PRIMARY KEY("key","action","window_start")
);
--> statement-breakpoint
CREATE TABLE "report_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_id" uuid NOT NULL,
	"storage_key" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	CONSTRAINT "report_images_storage_key_unique" UNIQUE("storage_key"),
	CONSTRAINT "report_images_status_check" CHECK ("status" in ('pending', 'approved', 'rejected'))
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_id" text NOT NULL,
	"issue_type" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"reject_reason" text,
	"division" text NOT NULL,
	"district" text NOT NULL,
	"upazila" text,
	"area_text" text,
	"entity_id" uuid,
	"incident_month" date NOT NULL,
	"description" text NOT NULL,
	"details" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"category" text NOT NULL,
	"amount_bdt" bigint,
	"outcome" text,
	"tracking_hash" text NOT NULL,
	"idempotency_key" uuid NOT NULL,
	"flags" text[] DEFAULT '{}' NOT NULL,
	"user_id" uuid,
	"real_weight" real DEFAULT 0 NOT NULL,
	"fake_weight" real DEFAULT 0 NOT NULL,
	"rank_score" real DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_at" timestamp with time zone,
	"reviewed_by" uuid,
	CONSTRAINT "reports_public_id_unique" UNIQUE("public_id"),
	CONSTRAINT "reports_tracking_hash_unique" UNIQUE("tracking_hash"),
	CONSTRAINT "reports_idempotency_key_unique" UNIQUE("idempotency_key"),
	CONSTRAINT "reports_status_check" CHECK ("status" in ('pending', 'approved', 'rejected', 'hidden')),
	CONSTRAINT "reports_reject_reason_check" CHECK ("reject_reason" is null or "reject_reason" in ('spam', 'personal_name', 'implausible', 'duplicate', 'other')),
	CONSTRAINT "reports_incident_month_check" CHECK (extract(day from "incident_month") = 1)
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "sessions_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "transparency_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"request_date" date NOT NULL,
	"requester_type" text NOT NULL,
	"what_asked" text NOT NULL,
	"outcome" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "upazilas" (
	"id" serial PRIMARY KEY NOT NULL,
	"district_id" integer NOT NULL,
	"name_bn" text NOT NULL,
	"slug" text NOT NULL,
	CONSTRAINT "upazilas_district_id_slug_unique" UNIQUE("district_id","slug")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pseudonym" text NOT NULL,
	"username_hmac" text NOT NULL,
	"email_hmac" text,
	"key_version" integer NOT NULL,
	"password_hash" text NOT NULL,
	"role" text DEFAULT 'user' NOT NULL,
	"totp_secret_enc" text,
	"must_change_password" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_pseudonym_unique" UNIQUE("pseudonym"),
	CONSTRAINT "users_username_hmac_unique" UNIQUE("username_hmac"),
	CONSTRAINT "users_email_hmac_unique" UNIQUE("email_hmac"),
	CONSTRAINT "users_role_check" CHECK ("role" in ('user', 'moderator', 'admin'))
);
--> statement-breakpoint
ALTER TABLE "admin_audit_log" ADD CONSTRAINT "admin_audit_log_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_issue_type_issue_types_slug_fk" FOREIGN KEY ("issue_type") REFERENCES "public"."issue_types"("slug") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "districts" ADD CONSTRAINT "districts_division_id_divisions_id_fk" FOREIGN KEY ("division_id") REFERENCES "public"."divisions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_images" ADD CONSTRAINT "report_images_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_issue_type_issue_types_slug_fk" FOREIGN KEY ("issue_type") REFERENCES "public"."issue_types"("slug") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_division_divisions_slug_fk" FOREIGN KEY ("division") REFERENCES "public"."divisions"("slug") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_district_districts_slug_fk" FOREIGN KEY ("district") REFERENCES "public"."districts"("slug") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "upazilas" ADD CONSTRAINT "upazilas_district_id_districts_id_fk" FOREIGN KEY ("district_id") REFERENCES "public"."districts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "admin_audit_log_created_idx" ON "admin_audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "report_images_report_idx" ON "report_images" USING btree ("report_id");--> statement-breakpoint
CREATE INDEX "reports_status_created_idx" ON "reports" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "reports_status_division_idx" ON "reports" USING btree ("status","division");--> statement-breakpoint
CREATE INDEX "reports_status_issue_category_idx" ON "reports" USING btree ("status","issue_type","category");
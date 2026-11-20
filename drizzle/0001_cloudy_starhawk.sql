ALTER TABLE "transparency_requests" ADD COLUMN "received_at" date NOT NULL;--> statement-breakpoint
ALTER TABLE "transparency_requests" ADD COLUMN "summary" text NOT NULL;--> statement-breakpoint
ALTER TABLE "transparency_requests" DROP COLUMN "request_date";--> statement-breakpoint
ALTER TABLE "transparency_requests" DROP COLUMN "what_asked";--> statement-breakpoint
ALTER TABLE "transparency_requests" ADD CONSTRAINT "transparency_requester_type_check" CHECK ("requester_type" in ('government', 'legal', 'company', 'other'));--> statement-breakpoint
ALTER TABLE "transparency_requests" ADD CONSTRAINT "transparency_outcome_check" CHECK ("outcome" in ('no_data_held', 'refused', 'content_removed', 'other'));
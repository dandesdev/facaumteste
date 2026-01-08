CREATE TABLE "facaumteste_evaluation_attempt" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"evaluation_id" uuid NOT NULL,
	"respondent_id" uuid,
	"respondent_session_id" uuid,
	"is_anonymous" boolean DEFAULT false NOT NULL,
	"attempt_number" integer DEFAULT 1 NOT NULL,
	"status" varchar(20) DEFAULT 'in_progress' NOT NULL,
	"current_item_order" integer DEFAULT 1,
	"started_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"submitted_at" timestamp with time zone,
	"time_spent_seconds" integer DEFAULT 0,
	"total_score" integer,
	"max_possible_score" integer
);
--> statement-breakpoint
ALTER TABLE "facaumteste_response" RENAME COLUMN "time_spent" TO "time_spent_seconds";--> statement-breakpoint
ALTER TABLE "facaumteste_response" DROP CONSTRAINT "facaumteste_response_evaluation_id_facaumteste_evaluation_id_fk";
--> statement-breakpoint
ALTER TABLE "facaumteste_response" DROP CONSTRAINT "facaumteste_response_respondent_id_facaumteste_user_id_fk";
--> statement-breakpoint
DROP INDEX "response_eval_idx";--> statement-breakpoint
DROP INDEX "response_respondent_idx";--> statement-breakpoint
DROP INDEX "response_session_idx";--> statement-breakpoint
ALTER TABLE "facaumteste_subject" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "facaumteste_evaluation" ADD COLUMN "display_settings" jsonb DEFAULT '{"itemsPerPage":1,"showProgressBar":true,"allowNavigation":true,"shuffleItems":false,"shuffleOptions":false}'::jsonb;--> statement-breakpoint
ALTER TABLE "facaumteste_evaluation" ADD COLUMN "time_settings" jsonb DEFAULT '{"allowLateSubmission":false}'::jsonb;--> statement-breakpoint
ALTER TABLE "facaumteste_evaluation" ADD COLUMN "retry_settings" jsonb DEFAULT '{"maxAttempts":1,"showPreviousAnswers":false}'::jsonb;--> statement-breakpoint
ALTER TABLE "facaumteste_response" ADD COLUMN "attempt_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "facaumteste_response" ADD COLUMN "updated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "facaumteste_subject" ADD COLUMN "external_code" varchar(64);--> statement-breakpoint
ALTER TABLE "facaumteste_evaluation_attempt" ADD CONSTRAINT "facaumteste_evaluation_attempt_evaluation_id_facaumteste_evaluation_id_fk" FOREIGN KEY ("evaluation_id") REFERENCES "public"."facaumteste_evaluation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "facaumteste_evaluation_attempt" ADD CONSTRAINT "facaumteste_evaluation_attempt_respondent_id_facaumteste_user_id_fk" FOREIGN KEY ("respondent_id") REFERENCES "public"."facaumteste_user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "attempt_eval_idx" ON "facaumteste_evaluation_attempt" USING btree ("evaluation_id");--> statement-breakpoint
CREATE INDEX "attempt_respondent_idx" ON "facaumteste_evaluation_attempt" USING btree ("respondent_id");--> statement-breakpoint
CREATE INDEX "attempt_session_idx" ON "facaumteste_evaluation_attempt" USING btree ("respondent_session_id");--> statement-breakpoint
CREATE INDEX "attempt_status_idx" ON "facaumteste_evaluation_attempt" USING btree ("status");--> statement-breakpoint
ALTER TABLE "facaumteste_response" ADD CONSTRAINT "facaumteste_response_attempt_id_facaumteste_evaluation_attempt_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."facaumteste_evaluation_attempt"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "response_attempt_idx" ON "facaumteste_response" USING btree ("attempt_id");--> statement-breakpoint
CREATE INDEX "subject_external_code_idx" ON "facaumteste_subject" USING btree ("external_code");--> statement-breakpoint
ALTER TABLE "facaumteste_response" DROP COLUMN "evaluation_id";--> statement-breakpoint
ALTER TABLE "facaumteste_response" DROP COLUMN "respondent_id";--> statement-breakpoint
ALTER TABLE "facaumteste_response" DROP COLUMN "respondent_session_id";--> statement-breakpoint
ALTER TABLE "facaumteste_response" DROP COLUMN "is_anonymous";--> statement-breakpoint
ALTER TABLE "facaumteste_subject" DROP COLUMN "name";
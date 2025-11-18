CREATE TABLE "facaumteste_anonymous_creator" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"evaluation_id" uuid NOT NULL,
	"management_token_hash" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"last_seen_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "facaumteste_evaluation_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"evaluation_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"order" integer NOT NULL,
	"points" integer DEFAULT 10,
	"settings" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint
CREATE TABLE "facaumteste_evaluation_permission" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"evaluation_id" uuid NOT NULL,
	"principal_type" varchar(10) NOT NULL,
	"principal_id" uuid NOT NULL,
	"can_edit" boolean DEFAULT false NOT NULL,
	"can_view" boolean DEFAULT true NOT NULL,
	"can_view_results" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "facaumteste_evaluation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"ownership_type" varchar(20) DEFAULT 'user' NOT NULL,
	"created_by" uuid,
	"organization_id" uuid,
	"edit_policy" jsonb DEFAULT '{}'::jsonb,
	"access_policy" jsonb DEFAULT '{"accessMode":"private","requireAuthToRespond":true,"participantScope":"any"}'::jsonb,
	"results_policy" jsonb DEFAULT '{"whenToShow":"never","whoSees":"editors"}'::jsonb,
	"status" varchar(20) DEFAULT 'draft',
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "facaumteste_item_permission" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_id" uuid NOT NULL,
	"principal_type" varchar(10) NOT NULL,
	"principal_id" uuid NOT NULL,
	"can_edit" boolean DEFAULT false NOT NULL,
	"can_view" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "facaumteste_item_skill" (
	"item_id" uuid NOT NULL,
	"skill_id" uuid NOT NULL,
	"weight" integer DEFAULT 1,
	CONSTRAINT "item_skill_pk" PRIMARY KEY("item_id","skill_id")
);
--> statement-breakpoint
CREATE TABLE "facaumteste_item_subject" (
	"item_id" uuid NOT NULL,
	"subject_id" uuid NOT NULL,
	"weight" integer DEFAULT 1,
	CONSTRAINT "item_subject_pk" PRIMARY KEY("item_id","subject_id")
);
--> statement-breakpoint
CREATE TABLE "facaumteste_item_version" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"snapshot" jsonb NOT NULL,
	"change_description" text,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "facaumteste_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" varchar(50) NOT NULL,
	"difficulty" varchar(20) DEFAULT 'medium',
	"ownership_type" varchar(20) DEFAULT 'user' NOT NULL,
	"created_by" uuid,
	"organization_id" uuid,
	"statement" jsonb NOT NULL,
	"structure" jsonb NOT NULL,
	"resolution" jsonb,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"usage_count" integer DEFAULT 0,
	"status" varchar(20) DEFAULT 'draft',
	"is_public" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "facaumteste_org_group_member" (
	"group_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" varchar(32) DEFAULT 'editor' NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "org_group_member_pk" PRIMARY KEY("group_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "facaumteste_org_group" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "facaumteste_organization_member" (
	"organization_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" varchar(32) DEFAULT 'editor' NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "org_member_pk" PRIMARY KEY("organization_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "facaumteste_organization" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"owner_id" uuid,
	"settings" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "facaumteste_organization_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "facaumteste_response" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"evaluation_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"respondent_id" uuid,
	"respondent_session_id" varchar(64),
	"is_anonymous" boolean DEFAULT false NOT NULL,
	"answer" jsonb NOT NULL,
	"is_correct" boolean,
	"score" integer DEFAULT 0,
	"time_spent" integer,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "facaumteste_skill" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(64) NOT NULL,
	"description" text,
	"scope" varchar(20) DEFAULT 'global' NOT NULL,
	"owner_org_id" uuid,
	"owner_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "facaumteste_subject" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"description" text,
	"parent_id" uuid,
	"scope" varchar(20) DEFAULT 'global' NOT NULL,
	"owner_org_id" uuid,
	"owner_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "facaumteste_user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255),
	"role" varchar(50) DEFAULT 'default' NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "facaumteste_user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "facaumteste_anonymous_creator" ADD CONSTRAINT "facaumteste_anonymous_creator_evaluation_id_facaumteste_evaluation_id_fk" FOREIGN KEY ("evaluation_id") REFERENCES "public"."facaumteste_evaluation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "facaumteste_evaluation_item" ADD CONSTRAINT "facaumteste_evaluation_item_evaluation_id_facaumteste_evaluation_id_fk" FOREIGN KEY ("evaluation_id") REFERENCES "public"."facaumteste_evaluation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "facaumteste_evaluation_item" ADD CONSTRAINT "facaumteste_evaluation_item_item_id_facaumteste_item_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."facaumteste_item"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "facaumteste_evaluation_permission" ADD CONSTRAINT "facaumteste_evaluation_permission_evaluation_id_facaumteste_evaluation_id_fk" FOREIGN KEY ("evaluation_id") REFERENCES "public"."facaumteste_evaluation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "facaumteste_evaluation" ADD CONSTRAINT "facaumteste_evaluation_created_by_facaumteste_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."facaumteste_user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "facaumteste_evaluation" ADD CONSTRAINT "facaumteste_evaluation_organization_id_facaumteste_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."facaumteste_organization"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "facaumteste_item_permission" ADD CONSTRAINT "facaumteste_item_permission_item_id_facaumteste_item_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."facaumteste_item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "facaumteste_item_skill" ADD CONSTRAINT "facaumteste_item_skill_item_id_facaumteste_item_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."facaumteste_item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "facaumteste_item_skill" ADD CONSTRAINT "facaumteste_item_skill_skill_id_facaumteste_skill_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."facaumteste_skill"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "facaumteste_item_subject" ADD CONSTRAINT "facaumteste_item_subject_item_id_facaumteste_item_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."facaumteste_item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "facaumteste_item_subject" ADD CONSTRAINT "facaumteste_item_subject_subject_id_facaumteste_subject_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."facaumteste_subject"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "facaumteste_item_version" ADD CONSTRAINT "facaumteste_item_version_item_id_facaumteste_item_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."facaumteste_item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "facaumteste_item_version" ADD CONSTRAINT "facaumteste_item_version_created_by_facaumteste_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."facaumteste_user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "facaumteste_item" ADD CONSTRAINT "facaumteste_item_created_by_facaumteste_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."facaumteste_user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "facaumteste_item" ADD CONSTRAINT "facaumteste_item_organization_id_facaumteste_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."facaumteste_organization"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "facaumteste_org_group_member" ADD CONSTRAINT "facaumteste_org_group_member_group_id_facaumteste_org_group_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."facaumteste_org_group"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "facaumteste_org_group_member" ADD CONSTRAINT "facaumteste_org_group_member_user_id_facaumteste_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."facaumteste_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "facaumteste_org_group" ADD CONSTRAINT "facaumteste_org_group_organization_id_facaumteste_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."facaumteste_organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "facaumteste_organization_member" ADD CONSTRAINT "facaumteste_organization_member_organization_id_facaumteste_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."facaumteste_organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "facaumteste_organization_member" ADD CONSTRAINT "facaumteste_organization_member_user_id_facaumteste_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."facaumteste_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "facaumteste_organization" ADD CONSTRAINT "facaumteste_organization_owner_id_facaumteste_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."facaumteste_user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "facaumteste_response" ADD CONSTRAINT "facaumteste_response_evaluation_id_facaumteste_evaluation_id_fk" FOREIGN KEY ("evaluation_id") REFERENCES "public"."facaumteste_evaluation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "facaumteste_response" ADD CONSTRAINT "facaumteste_response_item_id_facaumteste_item_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."facaumteste_item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "facaumteste_response" ADD CONSTRAINT "facaumteste_response_respondent_id_facaumteste_user_id_fk" FOREIGN KEY ("respondent_id") REFERENCES "public"."facaumteste_user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "facaumteste_skill" ADD CONSTRAINT "facaumteste_skill_owner_org_id_facaumteste_organization_id_fk" FOREIGN KEY ("owner_org_id") REFERENCES "public"."facaumteste_organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "facaumteste_skill" ADD CONSTRAINT "facaumteste_skill_owner_user_id_facaumteste_user_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."facaumteste_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "facaumteste_subject" ADD CONSTRAINT "facaumteste_subject_owner_org_id_facaumteste_organization_id_fk" FOREIGN KEY ("owner_org_id") REFERENCES "public"."facaumteste_organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "facaumteste_subject" ADD CONSTRAINT "facaumteste_subject_owner_user_id_facaumteste_user_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."facaumteste_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "evaluation_item_eval_idx" ON "facaumteste_evaluation_item" USING btree ("evaluation_id");--> statement-breakpoint
CREATE INDEX "evaluation_item_item_idx" ON "facaumteste_evaluation_item" USING btree ("item_id");--> statement-breakpoint
CREATE INDEX "evaluation_permission_eval_idx" ON "facaumteste_evaluation_permission" USING btree ("evaluation_id");--> statement-breakpoint
CREATE INDEX "evaluation_permission_principal_idx" ON "facaumteste_evaluation_permission" USING btree ("principal_type","principal_id");--> statement-breakpoint
CREATE INDEX "evaluation_org_idx" ON "facaumteste_evaluation" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "evaluation_status_idx" ON "facaumteste_evaluation" USING btree ("status");--> statement-breakpoint
CREATE INDEX "item_permission_item_idx" ON "facaumteste_item_permission" USING btree ("item_id");--> statement-breakpoint
CREATE INDEX "item_permission_principal_idx" ON "facaumteste_item_permission" USING btree ("principal_type","principal_id");--> statement-breakpoint
CREATE INDEX "item_skill_item_idx" ON "facaumteste_item_skill" USING btree ("item_id");--> statement-breakpoint
CREATE INDEX "item_skill_skill_idx" ON "facaumteste_item_skill" USING btree ("skill_id");--> statement-breakpoint
CREATE INDEX "item_subject_item_idx" ON "facaumteste_item_subject" USING btree ("item_id");--> statement-breakpoint
CREATE INDEX "item_subject_subject_idx" ON "facaumteste_item_subject" USING btree ("subject_id");--> statement-breakpoint
CREATE INDEX "item_type_idx" ON "facaumteste_item" USING btree ("type");--> statement-breakpoint
CREATE INDEX "item_created_by_idx" ON "facaumteste_item" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "item_org_idx" ON "facaumteste_item" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "item_status_idx" ON "facaumteste_item" USING btree ("status");--> statement-breakpoint
CREATE INDEX "org_group_member_group_idx" ON "facaumteste_org_group_member" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "org_group_member_user_idx" ON "facaumteste_org_group_member" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "org_member_org_idx" ON "facaumteste_organization_member" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "org_member_user_idx" ON "facaumteste_organization_member" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "response_eval_idx" ON "facaumteste_response" USING btree ("evaluation_id");--> statement-breakpoint
CREATE INDEX "response_item_idx" ON "facaumteste_response" USING btree ("item_id");--> statement-breakpoint
CREATE INDEX "response_respondent_idx" ON "facaumteste_response" USING btree ("respondent_id");--> statement-breakpoint
CREATE INDEX "response_session_idx" ON "facaumteste_response" USING btree ("respondent_session_id");--> statement-breakpoint
CREATE INDEX "skill_scope_idx" ON "facaumteste_skill" USING btree ("scope");--> statement-breakpoint
CREATE INDEX "skill_org_slug_idx" ON "facaumteste_skill" USING btree ("owner_org_id","slug");--> statement-breakpoint
CREATE INDEX "skill_user_slug_idx" ON "facaumteste_skill" USING btree ("owner_user_id","slug");--> statement-breakpoint
CREATE INDEX "skill_slug_idx" ON "facaumteste_skill" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "subject_scope_idx" ON "facaumteste_subject" USING btree ("scope");--> statement-breakpoint
CREATE INDEX "subject_org_slug_idx" ON "facaumteste_subject" USING btree ("owner_org_id","slug");--> statement-breakpoint
CREATE INDEX "subject_user_slug_idx" ON "facaumteste_subject" USING btree ("owner_user_id","slug");--> statement-breakpoint
CREATE INDEX "subject_parent_idx" ON "facaumteste_subject" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "subject_slug_idx" ON "facaumteste_subject" USING btree ("slug");
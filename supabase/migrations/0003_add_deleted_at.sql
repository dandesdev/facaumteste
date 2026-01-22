ALTER TABLE "facaumteste_item" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "item_deleted_idx" ON "facaumteste_item" USING btree ("deleted_at");--> statement-breakpoint
ALTER TABLE "facaumteste_item" DROP COLUMN "previous_status";
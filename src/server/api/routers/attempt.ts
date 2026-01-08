import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import {
    evaluations,
    evaluationAttempts,
    responses,
    evaluationItems,
} from "~/server/db/schema";
import { eq, and, desc, count } from "drizzle-orm";

export const attemptRouter = createTRPCRouter({
    /**
     * Start a new attempt or resume existing in-progress one
     */
    start: protectedProcedure
        .input(z.object({ evaluationId: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            // 1. Check if evaluation exists and is active/published
            const evaluation = await ctx.db.query.evaluations.findFirst({
                where: eq(evaluations.id, input.evaluationId),
            });

            if (!evaluation || !["published", "active"].includes(evaluation.status ?? "")) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Evaluation not found or not active",
                });
            }

            // 2. Check for existing in-progress attempt
            const existingAttempt = await ctx.db.query.evaluationAttempts.findFirst({
                where: and(
                    eq(evaluationAttempts.evaluationId, input.evaluationId),
                    eq(evaluationAttempts.respondentId, ctx.user.id),
                    eq(evaluationAttempts.status, "in_progress")
                ),
            });

            if (existingAttempt) {
                return existingAttempt; // Resume
            }

            // 3. Check retry limits (if not resuming)
            // Count previous attempts
            // Note: This is a simplified check. Real check needs to parse retrySettings JSON.
            // For now assuming unlimited or strict 1 attempt if not configured.

            const previousAttemptsCount = await ctx.db
                .select({ count: count() })
                .from(evaluationAttempts)
                .where(and(
                    eq(evaluationAttempts.evaluationId, input.evaluationId),
                    eq(evaluationAttempts.respondentId, ctx.user.id)
                ));

            const attemptCount = previousAttemptsCount[0]?.count ?? 0;
            const maxAttempts = evaluation.retrySettings?.maxAttempts ?? 1;

            if (maxAttempts > 0 && attemptCount >= maxAttempts) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "Maximum attempts reached",
                });
            }

            // 4. Create new attempt
            const [attempt] = await ctx.db
                .insert(evaluationAttempts)
                .values({
                    evaluationId: input.evaluationId,
                    respondentId: ctx.user.id,
                    attemptNumber: attemptCount + 1,
                    status: "in_progress",
                    startedAt: new Date(),
                })
                .returning();

            if (!attempt) {
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Failed to start attempt",
                });
            }

            return attempt;
        }),

    /**
     * Submit a response node (answer to an item)
     */
    submitResponse: protectedProcedure
        .input(
            z.object({
                attemptId: z.string().uuid(),
                itemId: z.string().uuid(),
                answer: z.any(), // JSON answer
                timeSpentSeconds: z.number().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            // Verify attempt ownership
            const attempt = await ctx.db.query.evaluationAttempts.findFirst({
                where: and(
                    eq(evaluationAttempts.id, input.attemptId),
                    eq(evaluationAttempts.respondentId, ctx.user.id)
                ),
            });

            if (!attempt || attempt.status !== "in_progress") {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "Attempt not found or not in progress",
                });
            }

            // Check if item belongs to evaluation
            const evalItem = await ctx.db.query.evaluationItems.findFirst({
                where: and(
                    eq(evaluationItems.evaluationId, attempt.evaluationId),
                    eq(evaluationItems.itemId, input.itemId)
                )
            });

            if (!evalItem) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Item does not belong to this evaluation",
                });
            }

            // Update or Insert response using upsert (if user changes answer)
            // Since we don't have a unique constraint on (attemptId, itemId) in schema yet (oops, we should probably add that for safety, but logic handles it)
            // We'll check if exists first

            const existingResponse = await ctx.db.query.responses.findFirst({
                where: and(
                    eq(responses.attemptId, input.attemptId),
                    eq(responses.itemId, input.itemId)
                )
            });

            if (existingResponse) {
                const [updated] = await ctx.db.update(responses)
                    .set({
                        answer: input.answer,
                        timeSpentSeconds: (existingResponse.timeSpentSeconds || 0) + (input.timeSpentSeconds || 0),
                        updatedAt: new Date()
                    })
                    .where(eq(responses.id, existingResponse.id))
                    .returning();
                return updated;
            } else {
                const [created] = await ctx.db.insert(responses)
                    .values({
                        attemptId: input.attemptId,
                        itemId: input.itemId,
                        answer: input.answer,
                        timeSpentSeconds: input.timeSpentSeconds,
                        // isCorrect/score would be calculated here if auto-grading is implemented
                    })
                    .returning();
                return created;
            }
        }),

    /**
     * Finish/Submit the attempt
     */
    finish: protectedProcedure
        .input(z.object({ attemptId: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            const attempt = await ctx.db.query.evaluationAttempts.findFirst({
                where: and(
                    eq(evaluationAttempts.id, input.attemptId),
                    eq(evaluationAttempts.respondentId, ctx.user.id)
                ),
            });

            if (!attempt || attempt.status !== "in_progress") {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Attempt not found or already submitted",
                });
            }

            const [updated] = await ctx.db.update(evaluationAttempts)
                .set({
                    status: "submitted",
                    submittedAt: new Date(),
                })
                .where(eq(evaluationAttempts.id, input.attemptId))
                .returning();

            return updated;
        }),
});

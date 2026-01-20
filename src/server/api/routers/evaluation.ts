import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import {
    evaluations,
    organizationMembers,
} from "~/server/db/schema";
import { eq, and, desc, inArray, isNull } from "drizzle-orm";

export const evaluationRouter = createTRPCRouter({
    /**
     * List evaluations
     * Can filter by organizationId
     */
    list: protectedProcedure
        .input(
            z.object({
                organizationId: z.string().uuid().optional(),
                status: z.enum(["draft", "published", "active", "closed"]).optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            // If organizationId is provided, check membership
            if (input.organizationId) {
                const membership = await ctx.db.query.organizationMembers.findFirst({
                    where: and(
                        eq(organizationMembers.organizationId, input.organizationId),
                        eq(organizationMembers.userId, ctx.user.id)
                    ),
                });

                if (!membership) {
                    throw new TRPCError({
                        code: "FORBIDDEN",
                        message: "You are not a member of this organization",
                    });
                }

                return await ctx.db.query.evaluations.findMany({
                    where: and(
                        eq(evaluations.organizationId, input.organizationId),
                        input.status ? eq(evaluations.status, input.status) : undefined
                    ),
                    orderBy: [desc(evaluations.createdAt)],
                    with: {
                        creator: true,
                    }
                });
            }

            // If no org ID, valid logic could be: "list personal evaluations" or "list all I have access to"
            // For now, let's list PERSONAL evaluations (where organizationId is null)
            return await ctx.db.query.evaluations.findMany({
                where: and(
                    eq(evaluations.createdBy, ctx.user.id),
                    isNull(evaluations.organizationId)
                ),
                orderBy: [desc(evaluations.createdAt)],
            });
        }),

    /**
     * Get single evaluation by ID
     */
    getById: protectedProcedure
        .input(z.object({ id: z.string().uuid() }))
        .query(async ({ ctx, input }) => {
            const evaluation = await ctx.db.query.evaluations.findFirst({
                where: eq(evaluations.id, input.id),
                with: {
                    creator: true,
                    org: true,
                },
            });

            if (!evaluation) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Evaluation not found",
                });
            }

            // Check access:
            // 1. If user is creator
            if (evaluation.createdBy === ctx.user.id) return evaluation;

            // 2. If user is member of organization
            if (evaluation.organizationId) {
                const membership = await ctx.db.query.organizationMembers.findFirst({
                    where: and(
                        eq(organizationMembers.organizationId, evaluation.organizationId),
                        eq(organizationMembers.userId, ctx.user.id)
                    ),
                });
                if (membership) return evaluation;
            }

            // 3. TODO: Check permission tables/policies for more complex access

            throw new TRPCError({
                code: "FORBIDDEN",
                message: "You do not have access to this evaluation",
            });
        }),

    /**
     * Create evaluation
     */
    create: protectedProcedure
        .input(
            z.object({
                title: z.string().min(1),
                description: z.string().optional(),
                organizationId: z.string().uuid().optional(), // Optional: if null, it's personal
            })
        )
        .mutation(async ({ ctx, input }) => {
            // If org ID provided, verify membership
            if (input.organizationId) {
                const membership = await ctx.db.query.organizationMembers.findFirst({
                    where: and(
                        eq(organizationMembers.organizationId, input.organizationId),
                        eq(organizationMembers.userId, ctx.user.id)
                    ),
                });

                if (!membership || !["owner", "admin", "editor"].includes(membership.role)) {
                    throw new TRPCError({
                        code: "FORBIDDEN",
                        message: "You do not have permission to create evaluations in this organization",
                    });
                }
            }

            const [evaluation] = await ctx.db
                .insert(evaluations)
                .values({
                    title: input.title,
                    description: input.description,
                    organizationId: input.organizationId,
                    createdBy: ctx.user.id,
                    status: "draft",
                    ownershipType: input.organizationId ? "organization" : "user",
                })
                .returning();

            return evaluation;
        }),

    /**
     * Update evaluation
     */
    update: protectedProcedure
        .input(
            z.object({
                id: z.string().uuid(),
                title: z.string().min(1).optional(),
                description: z.string().optional(),
                status: z.enum(["draft", "published", "active", "closed"]).optional(),
                // Add more fields as needed (policies, settings etc)
            })
        )
        .mutation(async ({ ctx, input }) => {
            // Fetch existing
            const evaluation = await ctx.db.query.evaluations.findFirst({
                where: eq(evaluations.id, input.id),
            });

            if (!evaluation) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Evaluation not found" });
            }

            // Check permissions
            // 1. Creator always can? Or only if personal?
            // 2. Org members with role
            let canEdit = false;

            if (evaluation.createdBy === ctx.user.id) {
                canEdit = true;
            } else if (evaluation.organizationId) {
                const membership = await ctx.db.query.organizationMembers.findFirst({
                    where: and(
                        eq(organizationMembers.organizationId, evaluation.organizationId),
                        eq(organizationMembers.userId, ctx.user.id)
                    ),
                });
                if (membership && ["owner", "admin", "editor"].includes(membership.role)) {
                    canEdit = true;
                }
            }

            if (!canEdit) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You do not have permission to edit this evaluation",
                });
            }

            const [updated] = await ctx.db
                .update(evaluations)
                .set({
                    title: input.title,
                    description: input.description,
                    status: input.status,
                })
                .where(eq(evaluations.id, input.id))
                .returning();

            return updated;
        }),
});

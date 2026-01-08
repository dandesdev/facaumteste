import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import {
    items,
    organizationMembers,
} from "~/server/db/schema";
import { eq, and, desc } from "drizzle-orm";

export const itemRouter = createTRPCRouter({
    /**
     * List items
     * Can filter by organizationId
     */
    list: protectedProcedure
        .input(
            z.object({
                organizationId: z.string().uuid().optional(),
                type: z
                    .enum([
                        "mcq_single",
                        "mcq_multiple",
                        "true_false",
                        "true_false_multi",
                        "fill_blank",
                        "matching",
                    ])
                    .optional(),
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

                return await ctx.db.query.items.findMany({
                    where: and(
                        eq(items.organizationId, input.organizationId),
                        input.type ? eq(items.type, input.type) : undefined
                    ),
                    orderBy: [desc(items.createdAt)],
                    with: {
                        creator: true,
                    }
                });
            }

            // If no org ID, list PERSONAL items
            return await ctx.db.query.items.findMany({
                where: and(
                    eq(items.createdBy, ctx.user.id),
                    input.organizationId === null ? undefined : eq(items.organizationId, null as any),
                    input.type ? eq(items.type, input.type) : undefined
                ),
                orderBy: [desc(items.createdAt)],
            });
        }),

    /**
     * Get single item by ID
     */
    getById: protectedProcedure
        .input(z.object({ id: z.string().uuid() }))
        .query(async ({ ctx, input }) => {
            const item = await ctx.db.query.items.findFirst({
                where: eq(items.id, input.id),
                with: {
                    creator: true,
                    organization: true,
                },
            });

            if (!item) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Item not found",
                });
            }

            // Check access:
            // 1. If user is creator
            if (item.createdBy === ctx.user.id) return item;

            // 2. If user is member of organization
            if (item.organizationId) {
                const membership = await ctx.db.query.organizationMembers.findFirst({
                    where: and(
                        eq(organizationMembers.organizationId, item.organizationId),
                        eq(organizationMembers.userId, ctx.user.id)
                    ),
                });
                if (membership) return item;
            }

            throw new TRPCError({
                code: "FORBIDDEN",
                message: "You do not have access to this item",
            });
        }),

    /**
     * Create item
     */
    create: protectedProcedure
        .input(
            z.object({
                type: z.enum([
                    "mcq_single",
                    "mcq_multiple",
                    "true_false",
                    "true_false_multi",
                    "fill_blank",
                    "matching",
                ]),
                difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
                organizationId: z.string().uuid().optional(),

                // JSONB fields - accepting generic objects/any for now
                statement: z.any(), // Lexical AST or simple string structure
                structure: z.any(), // Structure of the question (options etc)
                resolution: z.any().optional(), // Correct answer/explanation
                tags: z.array(z.string()).default([]),
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
                        message: "You do not have permission to create items in this organization",
                    });
                }
            }

            const [item] = await ctx.db
                .insert(items)
                .values({
                    type: input.type,
                    difficulty: input.difficulty,
                    organizationId: input.organizationId,
                    createdBy: ctx.user.id,
                    ownershipType: input.organizationId ? "organization" : "user",
                    statement: input.statement,
                    structure: input.structure,
                    resolution: input.resolution,
                    tags: input.tags,
                    status: "draft",
                })
                .returning();

            return item;
        }),

    /**
     * Update item
     */
    update: protectedProcedure
        .input(
            z.object({
                id: z.string().uuid(),
                statement: z.any().optional(),
                structure: z.any().optional(),
                resolution: z.any().optional(),
                difficulty: z.enum(["easy", "medium", "hard"]).optional(),
                tags: z.array(z.string()).optional(),
                status: z.enum(["draft", "published", "archived"]).optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            // Fetch existing
            const item = await ctx.db.query.items.findFirst({
                where: eq(items.id, input.id),
            });

            if (!item) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Item not found" });
            }

            // Check permissions
            let canEdit = false;

            if (item.createdBy === ctx.user.id) {
                canEdit = true;
            } else if (item.organizationId) {
                const membership = await ctx.db.query.organizationMembers.findFirst({
                    where: and(
                        eq(organizationMembers.organizationId, item.organizationId),
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
                    message: "You do not have permission to edit this item",
                });
            }

            const [updated] = await ctx.db
                .update(items)
                .set({
                    statement: input.statement,
                    structure: input.structure,
                    resolution: input.resolution,
                    difficulty: input.difficulty,
                    tags: input.tags,
                    status: input.status,
                    updatedAt: new Date(),
                })
                .where(eq(items.id, input.id))
                .returning();

            return updated;
        }),
});

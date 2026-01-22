import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import {
    items,
    organizationMembers,
} from "~/server/db/schema";
import { eq, and, desc, isNull, or, ilike, sql, count } from "drizzle-orm";

export const itemRouter = createTRPCRouter({
    /**
     * List items with pagination and filters
     * Returns items and total count for pagination
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
                status: z.enum(["draft", "published", "archived", "deleted"]).optional(),
                includeDeleted: z.boolean().optional().default(false),
                search: z.string().optional(),
                limit: z.number().min(1).max(100).default(10),
                offset: z.number().min(0).default(0),
            })
        )
        .query(async ({ ctx, input }) => {
            // Build base conditions
            const conditions = [];

            // Organization or personal space
            if (input.organizationId) {
                // Check membership for org items
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

                conditions.push(eq(items.organizationId, input.organizationId));
            } else {
                // Personal space - show items created by user with no organization
                // (items owned by user, not in any org)
                conditions.push(
                    and(
                        eq(items.createdBy, ctx.user.id),
                        isNull(items.organizationId)
                    )
                );
            }

            // Type filter
            if (input.type) {
                conditions.push(eq(items.type, input.type));
            }

            // Status filter - hide deleted unless explicitly requested
            if (input.status) {
                conditions.push(eq(items.status, input.status));
            } else if (!input.includeDeleted) {
                // By default, exclude deleted items
                conditions.push(sql`${items.status} != 'deleted'`);
            }

            // Search filter - search in ID or statement text
            if (input.search && input.search.trim()) {
                const searchTerm = `%${input.search.trim()}%`;
                conditions.push(
                    or(
                        ilike(items.id, searchTerm),
                        sql`${items.statement}::text ILIKE ${searchTerm}`
                    )
                );
            }

            const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

            // Get total count for pagination
            const [countResult] = await ctx.db
                .select({ total: count() })
                .from(items)
                .where(whereClause);

            // Get paginated items
            const itemsList = await ctx.db.query.items.findMany({
                where: whereClause,
                orderBy: [desc(items.updatedAt), desc(items.createdAt)],
                limit: input.limit,
                offset: input.offset,
                with: {
                    creator: true,
                },
            });

            return {
                items: itemsList,
                total: countResult?.total ?? 0,
                limit: input.limit,
                offset: input.offset,
            };
        }),

    /**
     * Get unique tags for autocomplete
     */
    getTags: protectedProcedure
        .input(
            z.object({
                organizationId: z.string().uuid().optional(),
                search: z.string().optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            // Build conditions based on space
            const conditions = [];

            if (input.organizationId) {
                // Check membership
                const membership = await ctx.db.query.organizationMembers.findFirst({
                    where: and(
                        eq(organizationMembers.organizationId, input.organizationId),
                        eq(organizationMembers.userId, ctx.user.id)
                    ),
                });
                if (!membership) {
                    return [];
                }
                conditions.push(eq(items.organizationId, input.organizationId));
            } else {
                // Personal items
                conditions.push(eq(items.createdBy, ctx.user.id));
                conditions.push(isNull(items.organizationId));
            }

            const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

            // Fetch all items' tags and flatten to unique set
            const itemsWithTags = await ctx.db.query.items.findMany({
                where: whereClause,
                columns: { tags: true },
            });

            const allTags = new Set<string>();
            for (const item of itemsWithTags) {
                const tags = item.tags as string[] | null;
                if (tags) {
                    for (const tag of tags) {
                        if (!input.search || tag.toLowerCase().includes(input.search.toLowerCase())) {
                            allTags.add(tag);
                        }
                    }
                }
            }

            return Array.from(allTags).sort();
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
                status: z.enum(["draft", "published"]).default("draft"),
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
                    status: input.status,
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

    /**
     * Soft delete multiple items (sets status to 'deleted')
     */
    deleteMany: protectedProcedure
        .input(z.object({ ids: z.array(z.string().uuid()) }))
        .mutation(async ({ ctx, input }) => {
            if (input.ids.length === 0) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "No item IDs provided",
                });
            }

            // Verify all items exist and user has permission
            const itemsToDelete = await ctx.db.query.items.findMany({
                where: or(...input.ids.map((id) => eq(items.id, id))),
            });

            if (itemsToDelete.length !== input.ids.length) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Some items were not found",
                });
            }

            // Check permissions for each item
            for (const item of itemsToDelete) {
                let canDelete = false;

                if (item.createdBy === ctx.user.id) {
                    canDelete = true;
                } else if (item.organizationId) {
                    const membership = await ctx.db.query.organizationMembers.findFirst({
                        where: and(
                            eq(organizationMembers.organizationId, item.organizationId),
                            eq(organizationMembers.userId, ctx.user.id)
                        ),
                    });
                    if (membership && ["owner", "admin"].includes(membership.role)) {
                        canDelete = true;
                    }
                }

                if (!canDelete) {
                    throw new TRPCError({
                        code: "FORBIDDEN",
                        message: `You do not have permission to delete item ${item.id}`,
                    });
                }
            }

            // Soft delete all items
            const deletedItems = await ctx.db
                .update(items)
                .set({
                    status: "deleted",
                    updatedAt: new Date(),
                })
                .where(or(...input.ids.map((id) => eq(items.id, id))))
                .returning();

            return { count: deletedItems.length, items: deletedItems };
        }),

    /**
     * Restore deleted items (sets status back to 'draft')
     */
    restore: protectedProcedure
        .input(z.object({ ids: z.array(z.string().uuid()) }))
        .mutation(async ({ ctx, input }) => {
            if (input.ids.length === 0) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "No item IDs provided",
                });
            }

            // Verify items exist and are deleted
            const itemsToRestore = await ctx.db.query.items.findMany({
                where: and(
                    or(...input.ids.map((id) => eq(items.id, id))),
                    eq(items.status, "deleted")
                ),
            });

            if (itemsToRestore.length === 0) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "No deleted items found with those IDs",
                });
            }

            // Check permissions
            for (const item of itemsToRestore) {
                let canRestore = false;

                if (item.createdBy === ctx.user.id) {
                    canRestore = true;
                } else if (item.organizationId) {
                    const membership = await ctx.db.query.organizationMembers.findFirst({
                        where: and(
                            eq(organizationMembers.organizationId, item.organizationId),
                            eq(organizationMembers.userId, ctx.user.id)
                        ),
                    });
                    if (membership && ["owner", "admin"].includes(membership.role)) {
                        canRestore = true;
                    }
                }

                if (!canRestore) {
                    throw new TRPCError({
                        code: "FORBIDDEN",
                        message: `You do not have permission to restore item ${item.id}`,
                    });
                }
            }

            // Restore items
            const restoredItems = await ctx.db
                .update(items)
                .set({
                    status: "draft",
                    updatedAt: new Date(),
                })
                .where(or(...input.ids.map((id) => eq(items.id, id))))
                .returning();

            return { count: restoredItems.length, items: restoredItems };
        }),

    /**
     * Permanently delete items (hard delete - only for items already in 'deleted' status)
     */
    permanentDelete: protectedProcedure
        .input(z.object({ ids: z.array(z.string().uuid()) }))
        .mutation(async ({ ctx, input }) => {
            if (input.ids.length === 0) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "No item IDs provided",
                });
            }

            // Verify items exist and are already deleted
            const itemsToDelete = await ctx.db.query.items.findMany({
                where: and(
                    or(...input.ids.map((id) => eq(items.id, id))),
                    eq(items.status, "deleted")
                ),
            });

            if (itemsToDelete.length === 0) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "No deleted items found with those IDs",
                });
            }

            // Check permissions - only creator or org admin/owner can permanently delete
            for (const item of itemsToDelete) {
                let canDelete = false;

                if (item.createdBy === ctx.user.id) {
                    canDelete = true;
                } else if (item.organizationId) {
                    const membership = await ctx.db.query.organizationMembers.findFirst({
                        where: and(
                            eq(organizationMembers.organizationId, item.organizationId),
                            eq(organizationMembers.userId, ctx.user.id)
                        ),
                    });
                    if (membership && ["owner", "admin"].includes(membership.role)) {
                        canDelete = true;
                    }
                }

                if (!canDelete) {
                    throw new TRPCError({
                        code: "FORBIDDEN",
                        message: `You do not have permission to permanently delete item ${item.id}`,
                    });
                }
            }

            // Hard delete from database
            await ctx.db
                .delete(items)
                .where(or(...input.ids.map((id) => eq(items.id, id))));

            return { count: itemsToDelete.length };
        }),
});

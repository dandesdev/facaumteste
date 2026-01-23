import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import {
    organizations,
    organizationMembers,
    users,
    orgGroups,
    orgGroupMembers,
} from "~/server/db/schema";
import { eq, and } from "drizzle-orm";

export const organizationRouter = createTRPCRouter({
    /**
     * List all organizations the current user is a member of
     */
    list: protectedProcedure.query(async ({ ctx }) => {
        // Join organizations with members where userId = ctx.user.id
        const userOrgs = await ctx.db
            .select({
                organization: organizations,
                role: organizationMembers.role,
            })
            .from(organizationMembers)
            .innerJoin(
                organizations,
                eq(organizationMembers.organizationId, organizations.id)
            )
            .where(eq(organizationMembers.userId, ctx.user.id));

        return userOrgs;
    }),

    /**
     * List groups for an organization (if member)
     */
    listGroups: protectedProcedure
        .input(z.object({ organizationId: z.string().uuid() }))
        .query(async ({ ctx, input }) => {
            // Check membership
            const member = await ctx.db.query.organizationMembers.findFirst({
                where: and(
                    eq(organizationMembers.organizationId, input.organizationId),
                    eq(organizationMembers.userId, ctx.user.id)
                ),
            });

            if (!member) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You are not a member of this organization",
                });
            }

            return await ctx.db.query.orgGroups.findMany({
                where: eq(orgGroups.organizationId, input.organizationId),
                orderBy: (groups, { desc }) => [desc(groups.createdAt)],
            });
        }),

    /**
     * Get organization details by slug (if member)
     */
    getBySlug: protectedProcedure
        .input(z.object({ slug: z.string() }))
        .query(async ({ ctx, input }) => {
            const org = await ctx.db.query.organizations.findFirst({
                where: eq(organizations.slug, input.slug),
                with: {
                    members: {
                        where: eq(organizationMembers.userId, ctx.user.id),
                    },
                },
            });

            if (!org || org.members.length === 0) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Organization not found or you are not a member",
                });
            }

            const { members, ...orgData } = org;
            return {
                ...orgData,
                userRole: members[0]?.role, // current user's role
            };
        }),

    /**
     * Get organization details by ID (if member)
     */
    getById: protectedProcedure
        .input(z.object({ id: z.string().uuid() }))
        .query(async ({ ctx, input }) => {
            const org = await ctx.db.query.organizations.findFirst({
                where: eq(organizations.id, input.id),
                with: {
                    members: {
                        where: eq(organizationMembers.userId, ctx.user.id),
                    },
                },
            });

            if (!org || org.members.length === 0) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Organization not found or you are not a member",
                });
            }

            const { members, ...orgData } = org;
            return {
                ...orgData,
                userRole: members[0]?.role,
            };
        }),

    /**
     * Get group details by ID
     */
    getGroupById: protectedProcedure
        .input(z.object({ id: z.string().uuid() }))
        .query(async ({ ctx, input }) => {
            const group = await ctx.db.query.orgGroups.findFirst({
                where: eq(orgGroups.id, input.id),
                with: {
                    members: {
                        where: eq(orgGroupMembers.userId, ctx.user.id),
                    },
                },
            });

            if (!group) {
                // If not found in user's groups membership, check if user is org admin/owner
                return null; // Or handle permission logic
            }
            
            // Check if user is member OR is org admin
            const member = await ctx.db.query.organizationMembers.findFirst({
                where: and(
                    eq(organizationMembers.organizationId, group.organizationId),
                    eq(organizationMembers.userId, ctx.user.id)
                ),
            });

            if (!member) {
                 throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "Access deined",
                });
            }

            return group;
        }),

    /**
     * Update group settings
     */
    updateGroup: protectedProcedure
        .input(
            z.object({
                id: z.string().uuid(),
                name: z.string().min(1).optional(),
                description: z.string().optional(),
                settings: z.any().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
             const group = await ctx.db.query.orgGroups.findFirst({
                where: eq(orgGroups.id, input.id),
            });

            if (!group) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Group not found" });
            }

            // Permission check: Must be Org Admin/Owner OR Group Admin (role logic simplified for now)
            // Real logic: check org role or group role
             const orgMembership = await ctx.db.query.organizationMembers.findFirst({
                where: and(
                    eq(organizationMembers.organizationId, group.organizationId),
                    eq(organizationMembers.userId, ctx.user.id)
                ),
            });
            
             const groupMembership = await ctx.db.query.orgGroupMembers.findFirst({
                 where: and(
                     eq(orgGroupMembers.groupId, input.id),
                     eq(orgGroupMembers.userId, ctx.user.id)
                 )
             });

            const isOrgAdmin = orgMembership && ["owner", "admin"].includes(orgMembership.role);
            const isGroupAdmin = groupMembership && ["admin"].includes(groupMembership.role);

            if (!isOrgAdmin && !isGroupAdmin) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "Insufficient permissions",
                });
            }

            const [updated] = await ctx.db
                .update(orgGroups)
                .set({
                    ...(input.name ? { name: input.name } : {}),
                    ...(input.description ? { description: input.description } : {}),
                    ...(input.settings ? { settings: input.settings } : {}),
                })
                .where(eq(orgGroups.id, input.id))
                .returning();

            return updated;
        }),

    /**
     * Update organization settings (Owner/Admin only)
     */
    update: protectedProcedure
        .input(
            z.object({
                id: z.string().uuid(),
                name: z.string().min(1).optional(),
                slug: z.string().min(3).regex(/^[a-z0-9-]+$/).optional(),
                settings: z.any().optional(), // typed in schema, but zod here for partial updates
            })
        )
        .mutation(async ({ ctx, input }) => {
            // 1. Check permission
            const membership = await ctx.db.query.organizationMembers.findFirst({
                where: and(
                    eq(organizationMembers.organizationId, input.id),
                    eq(organizationMembers.userId, ctx.user.id)
                ),
            });

            if (!membership || !["owner", "admin"].includes(membership.role)) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "Only owners and admins can update settings",
                });
            }

            // 2. Validate unique slug if changing
            if (input.slug) {
                const existing = await ctx.db.query.organizations.findFirst({
                    where: and(
                        eq(organizations.slug, input.slug),
                        // ne(organizations.id, input.id) // Importing 'ne' is needed
                    ),
                });
                
                // Since I can't easily import 'ne' inside this tool call without seeing imports,
                // I'll do a check in JS
                if (existing && existing.id !== input.id) {
                    throw new TRPCError({
                        code: "CONFLICT",
                        message: "Slug already taken",
                    });
                }
            }

            // 3. Update
            const [updated] = await ctx.db
                .update(organizations)
                .set({
                    ...(input.name ? { name: input.name } : {}),
                    ...(input.slug ? { slug: input.slug } : {}),
                    ...(input.settings ? { settings: input.settings } : {}),
                })
                .where(eq(organizations.id, input.id))
                .returning();

            return updated;
        }),

    /**
     * Create a new organization
     */
    create: protectedProcedure
        .input(
            z.object({
                name: z.string().min(1),
                slug: z.string().min(3).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with dashes"),
            })
        )
        .mutation(async ({ ctx, input }) => {
            // Check if slug exists
            const existing = await ctx.db.query.organizations.findFirst({
                where: eq(organizations.slug, input.slug),
            });

            if (existing) {
                throw new TRPCError({
                    code: "CONFLICT",
                    message: "Organization slug already exists",
                });
            }

            return await ctx.db.transaction(async (tx) => {
                // 1. Create Organization
                const [org] = await tx
                    .insert(organizations)
                    .values({
                        name: input.name,
                        slug: input.slug,
                        ownerId: ctx.user.id,
                    })
                    .returning();

                if (!org) {
                    throw new TRPCError({
                        code: "INTERNAL_SERVER_ERROR",
                        message: "Failed to create organization",
                    });
                }

                // 2. Add creator as Owner member
                await tx.insert(organizationMembers).values({
                    organizationId: org.id,
                    userId: ctx.user.id,
                    role: "owner",
                });

                return org;
            });
        }),

    /**
     * Add a member to an organization (Only owner/admin)
     * Note: This assumes the user already exists in the system. 
     * Integrating invites would be a future step.
     */
    addMember: protectedProcedure
        .input(
            z.object({
                organizationId: z.string().uuid(),
                email: z.string().email(),
                role: z.enum(["admin", "editor", "viewer", "student"]).default("student"),
            })
        )
        .mutation(async ({ ctx, input }) => {
            // 1. Check permission
            const membership = await ctx.db.query.organizationMembers.findFirst({
                where: and(
                    eq(organizationMembers.organizationId, input.organizationId),
                    eq(organizationMembers.userId, ctx.user.id)
                ),
            });

            if (!membership || !["owner", "admin"].includes(membership.role)) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You do not have permission to add members",
                });
            }

            // 2. Find user by email
            const userToAdd = await ctx.db.query.users.findFirst({
                where: eq(users.email, input.email),
            });

            if (!userToAdd) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "User not found with this email",
                });
            }

            // 3. Add to org
            await ctx.db
                .insert(organizationMembers)
                .values({
                    organizationId: input.organizationId,
                    userId: userToAdd.id,
                    role: input.role,
                })
                .onConflictDoNothing(); // If already member, do nothing (or could throw/update)

            return { success: true };
        }),
});

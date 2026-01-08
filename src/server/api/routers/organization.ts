import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import {
    organizations,
    organizationMembers,
    users,
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

import { z } from "zod";
import { eq } from "drizzle-orm";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { users } from "~/server/db/schema";

export const userRouter = createTRPCRouter({
  // Get current user with settings
  getMe: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.query.users.findFirst({
      where: eq(users.id, ctx.user.id),
    });
    
    if (!user) {
      throw new Error("User not found");
    }
    
    return user;
  }),

  // Update preferred color mode
  updatePreferredMode: protectedProcedure
    .input(z.object({
      mode: z.enum(["light", "dark", "system"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.query.users.findFirst({
        where: eq(users.id, ctx.user.id),
      });
      
      if (!user) {
        throw new Error("User not found");
      }
      
      // Merge with existing settings
      const newSettings = {
        ...user.settings,
        preferredMode: input.mode,
      };
      
      await ctx.db
        .update(users)
        .set({ settings: newSettings })
        .where(eq(users.id, ctx.user.id));
      
      return { success: true, mode: input.mode };
    }),

  // Update user profile (name, theme, etc.)
  update: protectedProcedure
    .input(z.object({
      name: z.string().min(2).optional(),
      settings: z.object({
        theme: z.object({
          primary: z.string().optional(),
          secondary: z.string().optional(),
          accent: z.string().optional(),
          radius: z.number().optional(),
        }).optional(),
        preferredMode: z.enum(["light", "dark", "system"]).optional(),
      }).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const updateData: Record<string, unknown> = {};
      
      if (input.name) {
        updateData.name = input.name;
      }
      
      if (input.settings) {
        const user = await ctx.db.query.users.findFirst({
          where: eq(users.id, ctx.user.id),
        });
        
        updateData.settings = {
          ...user?.settings,
          ...input.settings,
          theme: {
            ...user?.settings?.theme,
            ...input.settings.theme,
          },
        };
      }
      
      if (Object.keys(updateData).length > 0) {
        await ctx.db
          .update(users)
          .set(updateData)
          .where(eq(users.id, ctx.user.id));
      }
      
      return { success: true };
    }),
});

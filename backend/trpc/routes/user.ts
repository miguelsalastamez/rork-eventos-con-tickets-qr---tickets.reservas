import { createTRPCRouter, protectedProcedure } from "../create-context";
import { TRPCError } from "@trpc/server";

export const userRouter = createTRPCRouter({
  profile: protectedProcedure.query(async ({ ctx }) => {
    const { data: user, error } = await ctx.supabase
      .from("User")
      .select("*, organization:Organization(*)")
      .eq("id", ctx.userId)
      .single();

    if (error || !user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    return user;
  }),
});

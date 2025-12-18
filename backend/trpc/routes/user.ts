import { createTRPCRouter, protectedProcedure } from "../create-context";

export const userRouter = createTRPCRouter({
  profile: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.userId },
      include: {
        organization: true,
      },
    });

    return user;
  }),
});

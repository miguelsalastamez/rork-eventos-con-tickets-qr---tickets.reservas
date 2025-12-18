import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../create-context";

export const eventRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    const events = await ctx.prisma.event.findMany({
      where: {
        createdBy: ctx.userId,
      },
      include: {
        attendees: {
          select: {
            id: true,
            checkedIn: true,
          },
        },
        tickets: true,
        organization: true,
      },
      orderBy: {
        date: "desc",
      },
    });

    return events.map((event: any) => ({
      ...event,
      attendeeCount: event.attendees.length,
      checkedInCount: event.attendees.filter((a: any) => a.checkedIn).length,
    }));
  }),

  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const event = await ctx.prisma.event.findUnique({
        where: { id: input.id },
        include: {
          attendees: true,
          prizes: true,
          tickets: true,
          organization: true,
          creator: {
            select: {
              id: true,
              email: true,
              fullName: true,
            },
          },
        },
      });

      if (!event) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Event not found",
        });
      }

      return event;
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        date: z.date(),
        time: z.string(),
        venueName: z.string(),
        location: z.string(),
        imageUrl: z.string().optional(),
        organizerLogoUrl: z.string().optional(),
        primaryColor: z.string().optional(),
        secondaryColor: z.string().optional(),
        accentColor: z.string().optional(),
        organizationId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const event = await ctx.prisma.event.create({
        data: {
          ...input,
          createdBy: ctx.userId,
        },
      });

      return event;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        description: z.string().optional(),
        date: z.date().optional(),
        time: z.string().optional(),
        venueName: z.string().optional(),
        location: z.string().optional(),
        imageUrl: z.string().optional(),
        organizerLogoUrl: z.string().optional(),
        primaryColor: z.string().optional(),
        secondaryColor: z.string().optional(),
        accentColor: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const event = await ctx.prisma.event.findUnique({
        where: { id: input.id },
      });

      if (!event) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Event not found",
        });
      }

      if (event.createdBy !== ctx.userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to update this event",
        });
      }

      const { id, ...updateData } = input;
      const updatedEvent = await ctx.prisma.event.update({
        where: { id },
        data: updateData,
      });

      return updatedEvent;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const event = await ctx.prisma.event.findUnique({
        where: { id: input.id },
      });

      if (!event) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Event not found",
        });
      }

      if (event.createdBy !== ctx.userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to delete this event",
        });
      }

      await ctx.prisma.event.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),
});

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../create-context";

export const attendeeRouter = createTRPCRouter({
  list: publicProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ ctx, input }) => {
      const attendees = await ctx.prisma.attendee.findMany({
        where: { eventId: input.eventId },
        orderBy: { createdAt: "desc" },
      });

      return attendees;
    }),

  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const attendee = await ctx.prisma.attendee.findUnique({
        where: { id: input.id },
        include: {
          event: true,
        },
      });

      if (!attendee) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Attendee not found",
        });
      }

      return attendee;
    }),

  create: protectedProcedure
    .input(
      z.object({
        eventId: z.string(),
        fullName: z.string(),
        email: z.string().email(),
        employeeNumber: z.string(),
        ticketCode: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existingAttendee = await ctx.prisma.attendee.findFirst({
        where: {
          eventId: input.eventId,
          OR: [
            { email: input.email },
            { ticketCode: input.ticketCode },
          ],
        },
      });

      if (existingAttendee) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Attendee with this email or ticket code already exists",
        });
      }

      const attendee = await ctx.prisma.attendee.create({
        data: input,
      });

      return attendee;
    }),

  checkIn: protectedProcedure
    .input(z.object({ ticketCode: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const attendee = await ctx.prisma.attendee.findUnique({
        where: { ticketCode: input.ticketCode },
        include: {
          event: true,
        },
      });

      if (!attendee) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Ticket not found",
        });
      }

      if (attendee.checkedIn) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Attendee already checked in",
        });
      }

      const updatedAttendee = await ctx.prisma.attendee.update({
        where: { id: attendee.id },
        data: {
          checkedIn: true,
          checkedInAt: new Date(),
        },
      });

      return updatedAttendee;
    }),
});

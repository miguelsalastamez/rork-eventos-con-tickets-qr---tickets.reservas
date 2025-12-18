import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../create-context";

export const ticketRouter = createTRPCRouter({
  list: publicProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ ctx, input }) => {
      const tickets = await ctx.prisma.ticket.findMany({
        where: { eventId: input.eventId, isActive: true },
        orderBy: { createdAt: "desc" },
      });

      return tickets;
    }),

  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const ticket = await ctx.prisma.ticket.findUnique({
        where: { id: input.id },
        include: {
          event: true,
          pool: true,
        },
      });

      if (!ticket) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Ticket not found",
        });
      }

      return ticket;
    }),

  create: protectedProcedure
    .input(
      z.object({
        eventId: z.string(),
        name: z.string(),
        description: z.string().optional(),
        imageUrl: z.string().optional(),
        price: z.number(),
        currency: z.string().default("MXN"),
        capacityType: z.enum(["unlimited", "dedicated", "shared"]),
        dedicatedCapacity: z.number().optional(),
        sharedCapacityPoolId: z.string().optional(),
        saleStartDate: z.date(),
        saleEndDate: z.date(),
        formFields: z.any().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const event = await ctx.prisma.event.findUnique({
        where: { id: input.eventId },
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
          message: "You don't have permission to create tickets for this event",
        });
      }

      const ticket = await ctx.prisma.ticket.create({
        data: input,
      });

      return ticket;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        description: z.string().optional(),
        imageUrl: z.string().optional(),
        price: z.number().optional(),
        capacityType: z.enum(["unlimited", "dedicated", "shared"]).optional(),
        dedicatedCapacity: z.number().optional(),
        isActive: z.boolean().optional(),
        formFields: z.any().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const ticket = await ctx.prisma.ticket.findUnique({
        where: { id: input.id },
        include: { event: true },
      });

      if (!ticket) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Ticket not found",
        });
      }

      if (ticket.event.createdBy !== ctx.userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to update this ticket",
        });
      }

      const { id, ...updateData } = input;
      const updatedTicket = await ctx.prisma.ticket.update({
        where: { id },
        data: updateData,
      });

      return updatedTicket;
    }),
});

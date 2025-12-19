import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../create-context";

export const ticketRouter = createTRPCRouter({
  list: publicProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("Ticket")
        .select("*")
        .eq("eventId", input.eventId)
        .eq("isActive", true)
        .order("createdAt", { ascending: false });

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }

      return data || [];
    }),

  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const { data: ticket, error } = await ctx.supabase
        .from("Ticket")
        .select("*, event:Event(*), pool:CapacityPool(*)")
        .eq("id", input.id)
        .single();

      if (error || !ticket) {
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
        saleStartDate: z.string(),
        saleEndDate: z.string(),
        formFields: z.any().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { data: event } = await ctx.supabase
        .from("Event")
        .select("createdBy")
        .eq("id", input.eventId)
        .single();

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

      const ticketId = `ticket-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date().toISOString();

      const { data, error } = await ctx.supabase
        .from("Ticket")
        .insert({
          id: ticketId,
          ...input,
          soldCount: 0,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        })
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }

      return data;
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
      const { data: ticket } = await ctx.supabase
        .from("Ticket")
        .select("*, event:Event(createdBy)")
        .eq("id", input.id)
        .single();

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
      const { data, error } = await ctx.supabase
        .from("Ticket")
        .update({ ...updateData, updatedAt: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }

      return data;
    }),
});

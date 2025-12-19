import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../create-context";

export const attendeeRouter = createTRPCRouter({
  list: publicProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("Attendee")
        .select("*")
        .eq("eventId", input.eventId)
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
      const { data: attendee, error } = await ctx.supabase
        .from("Attendee")
        .select("*, event:Event(*)")
        .eq("id", input.id)
        .single();

      if (error || !attendee) {
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
      const { data: existing } = await ctx.supabase
        .from("Attendee")
        .select("id")
        .eq("eventId", input.eventId)
        .or(`email.eq.${input.email},ticketCode.eq.${input.ticketCode}`)
        .single();

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Attendee with this email or ticket code already exists",
        });
      }

      const attendeeId = `attendee-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const { data, error } = await ctx.supabase
        .from("Attendee")
        .insert({
          id: attendeeId,
          ...input,
          checkedIn: false,
          createdAt: new Date().toISOString(),
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

  createMany: protectedProcedure
    .input(
      z.object({
        attendees: z.array(
          z.object({
            eventId: z.string(),
            fullName: z.string(),
            email: z.string().email(),
            employeeNumber: z.string(),
            ticketCode: z.string(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const attendeesWithIds = input.attendees.map((a) => ({
        id: `attendee-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ...a,
        checkedIn: false,
        createdAt: new Date().toISOString(),
      }));

      const { data, error } = await ctx.supabase
        .from("Attendee")
        .insert(attendeesWithIds)
        .select();

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }

      return data;
    }),

  checkIn: protectedProcedure
    .input(z.object({ ticketCode: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { data: attendee, error: fetchError } = await ctx.supabase
        .from("Attendee")
        .select("*, event:Event(*)")
        .eq("ticketCode", input.ticketCode)
        .single();

      if (fetchError || !attendee) {
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

      const { data, error } = await ctx.supabase
        .from("Attendee")
        .update({
          checkedIn: true,
          checkedInAt: new Date().toISOString(),
        })
        .eq("id", attendee.id)
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

  toggleCheckIn: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { data: attendee } = await ctx.supabase
        .from("Attendee")
        .select("checkedIn")
        .eq("id", input.id)
        .single();

      if (!attendee) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Attendee not found",
        });
      }

      const { data, error } = await ctx.supabase
        .from("Attendee")
        .update({
          checkedIn: !attendee.checkedIn,
          checkedInAt: !attendee.checkedIn ? new Date().toISOString() : null,
        })
        .eq("id", input.id)
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

  checkInAll: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabase
        .from("Attendee")
        .update({
          checkedIn: true,
          checkedInAt: new Date().toISOString(),
        })
        .eq("eventId", input.eventId)
        .eq("checkedIn", false);

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }

      return { success: true };
    }),

  removeDuplicates: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { data: attendees } = await ctx.supabase
        .from("Attendee")
        .select("*")
        .eq("eventId", input.eventId)
        .order("createdAt", { ascending: false });

      if (!attendees || attendees.length === 0) {
        return { removed: 0 };
      }

      const seen = new Map<string, string>();
      const duplicateIds: string[] = [];

      for (const attendee of attendees) {
        const email = attendee.email.toLowerCase();
        if (seen.has(email)) {
          duplicateIds.push(attendee.id);
        } else {
          seen.set(email, attendee.id);
        }
      }

      if (duplicateIds.length > 0) {
        const { error } = await ctx.supabase
          .from("Attendee")
          .delete()
          .in("id", duplicateIds);

        if (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error.message,
          });
        }
      }

      return { removed: duplicateIds.length };
    }),
});

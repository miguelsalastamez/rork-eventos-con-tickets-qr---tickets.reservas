import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../create-context";

export const eventRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    const { data: events, error } = await ctx.supabase
      .from("Event")
      .select("*, attendees:Attendee(id, checkedIn), tickets:Ticket(*), organization:Organization(*)")
      .eq("createdBy", ctx.userId)
      .order("date", { ascending: false });

    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error.message,
      });
    }

    return (events || []).map((event: any) => ({
      ...event,
      attendeeCount: event.attendees?.length || 0,
      checkedInCount: event.attendees?.filter((a: any) => a.checkedIn).length || 0,
    }));
  }),

  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const { data: event, error } = await ctx.supabase
        .from("Event")
        .select("*, attendees:Attendee(*), prizes:Prize(*), tickets:Ticket(*), organization:Organization(*), creator:User!Event_createdBy_fkey(id, email, fullName)")
        .eq("id", input.id)
        .single();

      if (error || !event) {
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
        date: z.string(),
        time: z.string(),
        venueName: z.string(),
        location: z.string(),
        imageUrl: z.string().optional(),
        organizerLogoUrl: z.string().optional(),
        venuePlanUrl: z.string().optional(),
        employeeNumberLabel: z.string().optional(),
        successSoundId: z.string().optional(),
        errorSoundId: z.string().optional(),
        vibrationEnabled: z.boolean().optional(),
        vibrationIntensity: z.string().optional(),
        primaryColor: z.string().optional(),
        secondaryColor: z.string().optional(),
        accentColor: z.string().optional(),
        organizationId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const eventId = `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date().toISOString();

      const { data: event, error } = await ctx.supabase
        .from("Event")
        .insert({
          id: eventId,
          ...input,
          createdBy: ctx.userId,
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

      return event;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        description: z.string().optional(),
        date: z.string().optional(),
        time: z.string().optional(),
        venueName: z.string().optional(),
        location: z.string().optional(),
        imageUrl: z.string().optional(),
        organizerLogoUrl: z.string().optional(),
        venuePlanUrl: z.string().optional(),
        employeeNumberLabel: z.string().optional(),
        successSoundId: z.string().optional(),
        errorSoundId: z.string().optional(),
        vibrationEnabled: z.boolean().optional(),
        vibrationIntensity: z.string().optional(),
        primaryColor: z.string().optional(),
        secondaryColor: z.string().optional(),
        accentColor: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { data: event } = await ctx.supabase
        .from("Event")
        .select("createdBy")
        .eq("id", input.id)
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
          message: "You don't have permission to update this event",
        });
      }

      const { id, ...updateData } = input;
      const { data: updatedEvent, error } = await ctx.supabase
        .from("Event")
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

      return updatedEvent;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { data: event } = await ctx.supabase
        .from("Event")
        .select("createdBy")
        .eq("id", input.id)
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
          message: "You don't have permission to delete this event",
        });
      }

      const { error } = await ctx.supabase
        .from("Event")
        .delete()
        .eq("id", input.id);

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }

      return { success: true };
    }),

  prizes: createTRPCRouter({
    list: publicProcedure
      .input(z.object({ eventId: z.string() }))
      .query(async ({ ctx, input }) => {
        const { data, error } = await ctx.supabase
          .from("Prize")
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

    create: protectedProcedure
      .input(
        z.object({
          eventId: z.string(),
          name: z.string(),
          description: z.string().optional(),
          imageUrl: z.string().optional(),
          quantity: z.number().default(1),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const prizeId = `prize-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const { data, error } = await ctx.supabase
          .from("Prize")
          .insert({
            id: prizeId,
            ...input,
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
          prizes: z.array(
            z.object({
              eventId: z.string(),
              name: z.string(),
              description: z.string().optional(),
              imageUrl: z.string().optional(),
              quantity: z.number().default(1),
            })
          ),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const prizesWithIds = input.prizes.map((p) => ({
          id: `prize-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          ...p,
          createdAt: new Date().toISOString(),
        }));

        const { data, error } = await ctx.supabase
          .from("Prize")
          .insert(prizesWithIds)
          .select();

        if (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error.message,
          });
        }

        return data;
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const { error } = await ctx.supabase
          .from("Prize")
          .delete()
          .eq("id", input.id);

        if (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error.message,
          });
        }

        return { success: true };
      }),
  }),

  raffle: createTRPCRouter({
    winners: publicProcedure
      .input(z.object({ eventId: z.string() }))
      .query(async ({ ctx, input }) => {
        const { data, error } = await ctx.supabase
          .from("RaffleWinner")
          .select("*, prize:Prize(*), attendee:Attendee(*)")
          .eq("eventId", input.eventId)
          .order("wonAt", { ascending: false });

        if (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error.message,
          });
        }

        return data || [];
      }),

    addWinner: protectedProcedure
      .input(
        z.object({
          eventId: z.string(),
          prizeId: z.string(),
          attendeeId: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const winnerId = `winner-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const { data, error } = await ctx.supabase
          .from("RaffleWinner")
          .insert({
            id: winnerId,
            ...input,
            wonAt: new Date().toISOString(),
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

    addWinners: protectedProcedure
      .input(
        z.object({
          winners: z.array(
            z.object({
              eventId: z.string(),
              prizeId: z.string(),
              attendeeId: z.string(),
            })
          ),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const winnersWithIds = input.winners.map((w) => ({
          id: `winner-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          ...w,
          wonAt: new Date().toISOString(),
        }));

        const { data, error } = await ctx.supabase
          .from("RaffleWinner")
          .insert(winnersWithIds)
          .select();

        if (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error.message,
          });
        }

        return data;
      }),

    deleteWinner: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const { error } = await ctx.supabase
          .from("RaffleWinner")
          .delete()
          .eq("id", input.id);

        if (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error.message,
          });
        }

        return { success: true };
      }),

    deleteAll: protectedProcedure
      .input(z.object({ eventId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const { error } = await ctx.supabase
          .from("RaffleWinner")
          .delete()
          .eq("eventId", input.eventId);

        if (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error.message,
          });
        }

        return { success: true };
      }),
  }),
});

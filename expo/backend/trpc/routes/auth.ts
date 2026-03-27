import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "../create-context";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

export const authRouter = createTRPCRouter({
  register: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(6),
        fullName: z.string(),
        phone: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { data: existingUser } = await ctx.supabase
        .from("User")
        .select("id")
        .eq("email", input.email)
        .single();

      if (existingUser) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "User with this email already exists",
        });
      }

      const hashedPassword = await bcrypt.hash(input.password, 10);
      const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const { data: user, error } = await ctx.supabase
        .from("User")
        .insert({
          id: userId,
          email: input.email,
          password: hashedPassword,
          fullName: input.fullName,
          phone: input.phone,
          role: "viewer",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
        expiresIn: "30d",
      });

      return {
        token,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          phone: user.phone,
          role: user.role,
        },
      };
    }),

  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { data: user, error } = await ctx.supabase
        .from("User")
        .select("*")
        .eq("email", input.email)
        .single();

      if (error || !user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
        });
      }

      const isValidPassword = await bcrypt.compare(input.password, user.password);

      if (!isValidPassword) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
        });
      }

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
        expiresIn: "30d",
      });

      return {
        token,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          phone: user.phone,
          role: user.role,
        },
      };
    }),

  me: protectedProcedure.query(async ({ ctx }) => {
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

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      role: user.role,
      organization: user.organization,
    };
  }),

  guestLogin: publicProcedure.mutation(async ({ ctx }) => {
    const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const email = `guest-${Date.now()}@example.com`;

    const { data: user, error } = await ctx.supabase
      .from("User")
      .insert({
        id: userId,
        email,
        password: "placeholder",
        fullName: "Demo User",
        role: "seller_admin",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error.message,
      });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: "30d",
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
      },
    };
  }),
});

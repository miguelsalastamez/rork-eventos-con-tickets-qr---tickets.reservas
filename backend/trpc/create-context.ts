import { initTRPC, TRPCError } from "@trpc/server";
import { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import superjson from "superjson";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || "https://qaiaigeskomvqvcvgobo.supabase.co";
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_ZPA_pYdnkoZ9l6RecVFZ0Q_KnLj61Ms";

const supabase = createClient(supabaseUrl, supabaseKey);

const DEFAULT_TEST_USER_ID = "6bbd57f7-bf8f-41b1-9d85-92bbbf49d1f0";

export const createContext = async (opts: FetchCreateContextFnOptions) => {
  const userId = DEFAULT_TEST_USER_ID;

  return {
    req: opts.req,
    supabase,
    userId,
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated" });
  }
  return next({
    ctx: {
      ...ctx,
      userId: ctx.userId as string,
    },
  });
});

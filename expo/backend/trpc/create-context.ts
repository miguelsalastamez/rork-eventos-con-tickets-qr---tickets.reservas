import { initTRPC } from "@trpc/server";
import { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import superjson from "superjson";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "";

const supabase = createClient(supabaseUrl, supabaseKey);

const DEFAULT_TEST_USER_ID = "6bbd57f7-bf8f-41b1-9d85-92bbbf49d1f0";
const DEFAULT_TEST_TOKEN = "test-token-default";

export const createContext = async (opts: FetchCreateContextFnOptions) => {
  const authHeader = opts.req.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "");

  console.log("🔐 Auth token:", token ? token.substring(0, 20) + "..." : "none");

  let userId = DEFAULT_TEST_USER_ID;

  if (token && token !== DEFAULT_TEST_TOKEN) {
    console.log("⚠️ Non-default token provided, but using default user for testing");
  }

  console.log("✅ Using user ID:", userId);

  return {
    req: opts.req,
    supabase,
    userId,
    isAuthenticated: true,
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  return next({
    ctx: {
      ...ctx,
      userId: ctx.userId || DEFAULT_TEST_USER_ID,
    },
  });
});

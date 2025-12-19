import { trpcServer } from "@hono/trpc-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { createClient } from "@supabase/supabase-js";
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";
import { serve } from "@hono/node-server";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || "https://qaiaigeskomvqvcvgobo.supabase.co";
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_ZPA_pYdnkoZ9l6RecVFZ0Q_KnLj61Ms";
const supabase = createClient(supabaseUrl, supabaseKey);

const app = new Hono();

app.use("*", cors({
  origin: "*",
  credentials: true,
}));

app.use(
  "/api/trpc/*",
  trpcServer({
    endpoint: "/api/trpc",
    router: appRouter,
    createContext,
  }),
);

app.get("/", async (c) => {
  let dbStatus = "disconnected";
  try {
    const { error } = await supabase.from("Event").select("id").limit(1);
    dbStatus = error ? "disconnected" : "connected";
  } catch (error) {
    console.error("Database connection error:", error);
  }
  return c.json({
    status: "ok",
    message: "API is running",
    database: dbStatus,
    timestamp: new Date().toISOString()
  });
});

app.get("/health", (c) => {
  return c.json({ status: "healthy" });
});

// Iniciar el servidor
const port = parseInt(process.env.PORT || "3001");

console.log(`🚀 Starting server on port ${port}...`);

serve({
  fetch: app.fetch,
  port,
});

console.log(`✅ Server running on http://localhost:${port}`);

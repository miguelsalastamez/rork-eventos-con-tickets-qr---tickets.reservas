import { trpcServer } from "@hono/trpc-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { PrismaClient } from "@prisma/client";

import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";

const prisma = new PrismaClient();

const app = new Hono();

app.use("*", cors({
  origin: "*",
  credentials: true,
}));

app.use(
  "/trpc/*",
  trpcServer({
    endpoint: "/api/trpc",
    router: appRouter,
    createContext,
  }),
);

app.get("/", async (c) => {
  let dbStatus = "disconnected";
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = "connected";
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

export default app;

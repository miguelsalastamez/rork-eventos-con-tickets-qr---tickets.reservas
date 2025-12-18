import { createTRPCRouter } from "./create-context";
import { authRouter } from "./routes/auth";
import { eventRouter } from "./routes/event";
import { attendeeRouter } from "./routes/attendee";
import { ticketRouter } from "./routes/ticket";
import { userRouter } from "./routes/user";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  event: eventRouter,
  attendee: attendeeRouter,
  ticket: ticketRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;

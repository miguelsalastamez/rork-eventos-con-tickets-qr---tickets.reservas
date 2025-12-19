import { httpLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import superjson from "superjson";
import Constants from 'expo-constants';
import type { AppRouter } from "@/backend/trpc/app-router";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  const url = Constants.expoConfig?.extra?.EXPO_PUBLIC_RORK_API_BASE_URL || 
              process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  if (!url) {
    throw new Error(
      "EXPO_PUBLIC_RORK_API_BASE_URL not configured in app.json extra section",
    );
  }
  return url;
};

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
    }),
  ],
});

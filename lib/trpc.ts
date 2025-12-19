import { httpLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import superjson from "superjson";
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppRouter } from "@/backend/trpc/app-router";

const AUTH_TOKEN_STORAGE_KEY = '@eventpass_auth_token';

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return "https://tickets.reservas.events";
  }
  return "https://tickets.reservas.events";
};

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
      headers: async () => {
        const token = await AsyncStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
      },
    }),
  ],
});

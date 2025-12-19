import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, Component, ErrorInfo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { EventProvider } from "@/contexts/EventContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { MessagingProvider } from "@/contexts/MessagingContext";
import { UserProvider } from "@/contexts/UserContext";
import { TicketProvider } from "@/contexts/TicketContext";
import { trpc, trpcClient } from "@/lib/trpc";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={errorStyles.container}>
          <Text style={errorStyles.title}>Algo salió mal</Text>
          <Text style={errorStyles.message}>
            {this.state.error?.message || 'Error desconocido'}
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}

const errorStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f9fafb',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  message: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
});

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Atrás" }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen 
        name="create-event" 
        options={{ 
          title: "Crear Evento",
          presentation: "modal"
        }} 
      />
      <Stack.Screen 
        name="event/[id]" 
        options={{ 
          title: "Detalles del Evento"
        }} 
      />
      <Stack.Screen 
        name="event/[id]/add-attendees" 
        options={{ 
          title: "Agregar Invitados"
        }} 
      />
      <Stack.Screen 
        name="event/[id]/attendees" 
        options={{ 
          title: "Lista de Invitados"
        }} 
      />
      <Stack.Screen 
        name="event/[id]/edit" 
        options={{ 
          title: "Editar Evento"
        }} 
      />
      <Stack.Screen 
        name="ticket/[attendeeId]" 
        options={{ 
          title: "Ticket",
          presentation: "modal"
        }} 
      />
      <Stack.Screen 
        name="scan-qr" 
        options={{ 
          title: "Escanear QR",
          presentation: "modal"
        }} 
      />
      <Stack.Screen 
        name="settings" 
        options={{ 
          title: "Configuración",
          presentation: "modal"
        }} 
      />
      <Stack.Screen 
        name="profile" 
        options={{ 
          title: "Mi cuenta",
          presentation: "modal"
        }} 
      />
      <Stack.Screen 
        name="profile/account" 
        options={{ 
          title: "Mi cuenta"
        }} 
      />
      <Stack.Screen 
        name="profile/security" 
        options={{ 
          title: "Seguridad"
        }} 
      />
      <Stack.Screen 
        name="profile/my-purchases" 
        options={{ 
          title: "Mis compras"
        }} 
      />
      <Stack.Screen 
        name="profile/payment-methods" 
        options={{ 
          title: "Métodos de pago"
        }} 
      />
      <Stack.Screen 
        name="store/[slug]" 
        options={{ 
          title: "Tienda"
        }} 
      />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <ErrorBoundary>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <UserProvider>
            <SettingsProvider>
              <EventProvider>
                <TicketProvider>
                  <MessagingProvider>
                    <GestureHandlerRootView style={{ flex: 1 }}>
                      <RootLayoutNav />
                    </GestureHandlerRootView>
                  </MessagingProvider>
                </TicketProvider>
              </EventProvider>
            </SettingsProvider>
          </UserProvider>
        </QueryClientProvider>
      </trpc.Provider>
    </ErrorBoundary>
  );
}

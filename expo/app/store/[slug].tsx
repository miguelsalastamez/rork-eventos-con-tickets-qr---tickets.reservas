import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { Globe, Mail, Phone, Calendar, MapPin, Ticket } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

type Event = {
  id: string;
  name: string;
  description: string | null;
  date: Date;
  time: string;
  venueName: string;
  location: string;
  imageUrl: string | null;
  tickets: {
    id: string;
    name: string;
    price: number;
    currency: string;
  }[];
  _count: {
    attendees: number;
  };
};

type Organization = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  website: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  events: Event[];
  _count: {
    events: number;
  };
};

export default function StorePage() {
  const { slug } = useLocalSearchParams<{ slug: string }>();

  const organization: Organization | undefined = undefined;
  const isLoading = false;
  const error = new Error('Backend not available');

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Cargando tienda...</Text>
      </View>
    );
  }

  if (error || !organization) {
    return (
      <View style={styles.errorContainer}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={styles.errorTitle}>Tienda no encontrada</Text>
        <Text style={styles.errorText}>
          La tienda que buscas no existe o ha sido eliminada
        </Text>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  const org = organization as Organization;

  const handleOpenWebsite = () => {
    if (org.website) {
      Linking.openURL(org.website);
    }
  };

  const handleContactEmail = () => {
    if (org.contactEmail) {
      Linking.openURL(`mailto:${org.contactEmail}`);
    }
  };

  const handleContactPhone = () => {
    if (org.contactPhone) {
      Linking.openURL(`tel:${org.contactPhone}`);
    }
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: currency,
    }).format(price);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: org.name,
          headerStyle: {
            backgroundColor: '#fff',
          },
          headerTintColor: '#000',
          headerShadowVisible: false,
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {org.coverUrl && (
          <Image source={{ uri: org.coverUrl }} style={styles.coverImage} />
        )}

        <View style={styles.headerSection}>
          <View style={styles.headerContent}>
            {org.logoUrl && (
              <Image source={{ uri: org.logoUrl }} style={styles.logo} />
            )}
            <View style={styles.headerInfo}>
              <Text style={styles.storeName}>{org.name}</Text>
              {org.description && (
                <Text style={styles.storeDescription}>{org.description}</Text>
              )}
            </View>
          </View>

          <View style={styles.contactSection}>
            {org.website && (
              <Pressable style={styles.contactButton} onPress={handleOpenWebsite}>
                <Globe size={20} color="#007AFF" strokeWidth={2} />
                <Text style={styles.contactButtonText}>Sitio web</Text>
              </Pressable>
            )}
            {org.contactEmail && (
              <Pressable style={styles.contactButton} onPress={handleContactEmail}>
                <Mail size={20} color="#007AFF" strokeWidth={2} />
                <Text style={styles.contactButtonText}>Email</Text>
              </Pressable>
            )}
            {org.contactPhone && (
              <Pressable style={styles.contactButton} onPress={handleContactPhone}>
                <Phone size={20} color="#007AFF" strokeWidth={2} />
                <Text style={styles.contactButtonText}>Teléfono</Text>
              </Pressable>
            )}
          </View>
        </View>

        <View style={styles.eventsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Eventos Próximos</Text>
            <Text style={styles.eventCount}>
              {org.events.length} evento{org.events.length !== 1 ? 's' : ''}
            </Text>
          </View>

          {org.events.length === 0 ? (
            <View style={styles.emptyState}>
              <Calendar size={48} color="#999" strokeWidth={1.5} />
              <Text style={styles.emptyStateTitle}>No hay eventos próximos</Text>
              <Text style={styles.emptyStateText}>
                Esta tienda no tiene eventos programados en este momento
              </Text>
            </View>
          ) : (
            <View style={styles.eventsList}>
              {org.events.map((event) => (
                <Pressable
                  key={event.id}
                  style={styles.eventCard}
                  onPress={() => router.push(`/event/${event.id}`)}
                >
                  {event.imageUrl && (
                    <View style={styles.imageContainer}>
                      <Image
                        source={{ uri: event.imageUrl }}
                        style={styles.eventImage}
                      />
                      <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.8)']}
                        style={styles.eventGradient}
                      />
                    </View>
                  )}

                  <View style={styles.eventContent}>
                    <Text style={styles.eventName} numberOfLines={2}>
                      {event.name}
                    </Text>

                    <View style={styles.eventDetails}>
                      <View style={styles.eventDetailRow}>
                        <Calendar size={14} color="#666" strokeWidth={2} />
                        <Text style={styles.eventDetailText}>
                          {formatDate(event.date)} • {event.time}
                        </Text>
                      </View>

                      <View style={styles.eventDetailRow}>
                        <MapPin size={14} color="#666" strokeWidth={2} />
                        <Text style={styles.eventDetailText} numberOfLines={1}>
                          {event.venueName}
                        </Text>
                      </View>

                      {event.tickets.length > 0 && (
                        <View style={styles.ticketInfo}>
                          <Ticket size={14} color="#4CAF50" strokeWidth={2} />
                          <Text style={styles.ticketPrice}>
                            Desde {formatPrice(
                              Math.min(...event.tickets.map((t) => t.price)),
                              event.tickets[0].currency
                            )}
                          </Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.eventFooter}>
                      <Text style={styles.attendeesCount}>
                        {event._count.attendees} asistente
                        {event._count.attendees !== 1 ? 's' : ''}
                      </Text>
                      <View style={styles.viewButton}>
                        <Text style={styles.viewButtonText}>Ver detalles</Text>
                      </View>
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Tienda de {org.name} • {org._count.events} eventos totales
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#000',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  coverImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#e1e4e8',
  },
  headerSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e4e8',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#e1e4e8',
    marginRight: 16,
  },
  headerInfo: {
    flex: 1,
  },
  storeName: {
    fontSize: 26,
    fontWeight: '700' as const,
    color: '#000',
    marginBottom: 8,
  },
  storeDescription: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
  },
  contactSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f7ff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  contactButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#007AFF',
  },
  eventsSection: {
    marginTop: 16,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: '#000',
  },
  eventCount: {
    fontSize: 15,
    color: '#666',
    fontWeight: '500' as const,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
    backgroundColor: '#fff',
    borderRadius: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#000',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  eventsList: {
    gap: 16,
  },
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      },
    }),
  },
  eventImage: {
    width: '100%',
    height: 240,
    backgroundColor: '#e1e4e8',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 240,
  },
  eventGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 240,
  },
  eventContent: {
    padding: 16,
  },
  eventName: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#000',
    marginBottom: 12,
  },
  eventDetails: {
    gap: 8,
    marginBottom: 12,
  },
  eventDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eventDetailText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  ticketInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  ticketPrice: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#4CAF50',
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e1e4e8',
  },
  attendeesCount: {
    fontSize: 13,
    color: '#666',
  },
  viewButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#fff',
  },
  footer: {
    marginTop: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});

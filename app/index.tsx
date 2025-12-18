import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Plus, Calendar, MapPin, Users, Database, Settings, TrendingUp, User as UserIcon } from 'lucide-react-native';
import { useEvents } from '@/contexts/EventContext';
import { useUser } from '@/contexts/UserContext';
import { LinearGradient } from 'expo-linear-gradient';
import MediaViewer from '@/components/MediaViewer';

export default function HomeScreen() {
  const router = useRouter();
  const { events, getEventAttendees, isLoading, loadSampleData } = useEvents();
  const { user, createDemoUser, permissions, subscriptionTier, featureLimits } = useUser();
  const [loadingData, setLoadingData] = useState(false);
  const [showRoleSelector, setShowRoleSelector] = useState(false);

  const handleLoadSampleData = async () => {
    Alert.alert(
      'Cargar datos de prueba',
      '¿Deseas cargar 10 eventos de ejemplo? Esto reemplazará todos los datos actuales.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Cargar',
          onPress: async () => {
            setLoadingData(true);
            try {
              await loadSampleData();
              Alert.alert('Éxito', '10 eventos de prueba han sido cargados correctamente');
            } catch {
              Alert.alert('Error', 'No se pudieron cargar los datos de prueba');
            } finally {
              setLoadingData(false);
            }
          },
        },
      ]
    );
  };

  React.useEffect(() => {
    if (!isLoading && !user) {
      createDemoUser('seller_admin');
    }
  }, [isLoading, user, createDemoUser]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#6366f1', '#8b5cf6', '#d946ef']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.headerTitle}>EventPass</Text>
              <Text style={styles.headerSubtitle}>Gestiona tus eventos</Text>
            </View>
            <View style={styles.headerButtons}>
              <TouchableOpacity
                style={styles.createButton}
                onPress={() => router.push('/profile' as any)}
              >
                <UserIcon color="#fff" size={20} />
              </TouchableOpacity>
              {user?.role === 'super_admin' && (
                <TouchableOpacity
                  style={styles.createButton}
                  onPress={() => router.push('/admin' as any)}
                >
                  <Users color="#fff" size={20} />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.createButton}
                onPress={() => router.push('/subscription' as any)}
              >
                <TrendingUp color="#fff" size={20} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.createButton}
                onPress={() => router.push('/settings' as any)}
              >
                <Settings color="#fff" size={20} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.createButton}
                onPress={handleLoadSampleData}
                disabled={loadingData}
              >
                <Database color="#fff" size={20} />
              </TouchableOpacity>
              {permissions.canCreateEvents && events.length < featureLimits.maxEvents && (
                <TouchableOpacity
                  style={styles.createButton}
                  onPress={() => router.push('/create-event' as any)}
                >
                  <Plus color="#fff" size={24} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {events.length === 0 ? (
          <View style={styles.emptyState}>
            <Calendar color="#9ca3af" size={64} strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>No hay eventos</Text>
            <Text style={styles.emptyText}>
              Crea tu primer evento para comenzar a gestionar invitados y tickets
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => router.push('/create-event' as any)}
            >
              <Text style={styles.emptyButtonText}>Crear Evento</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.eventsGrid}>
            {events.map((event) => {
              const attendees = getEventAttendees(event.id);
              const checkedInCount = attendees.filter(a => a.checkedIn).length;

              return (
                <TouchableOpacity
                  key={event.id}
                  style={styles.eventCard}
                  onPress={() => router.push(`/event/${event.id}` as any)}
                  activeOpacity={0.7}
                >
                  <MediaViewer
                    uri={event.imageUrl}
                    style={styles.eventImage}
                    resizeMode="cover"
                  />
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.8)']}
                    style={styles.eventGradient}
                  >
                    <View style={styles.eventInfo}>
                      <Text style={styles.eventName} numberOfLines={2}>
                        {event.name}
                      </Text>
                      <View style={styles.eventDetails}>
                        <View style={styles.eventDetailRow}>
                          <Calendar color="#fff" size={14} />
                          <Text style={styles.eventDetailText}>
                            {new Date(event.date).toLocaleDateString('es-ES', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })} · {event.time}
                          </Text>
                        </View>
                        <View style={styles.eventDetailRow}>
                          <MapPin color="#fff" size={14} />
                          <Text style={styles.eventDetailText} numberOfLines={1}>
                            {event.venueName}
                          </Text>
                        </View>
                        <View style={styles.eventDetailRow}>
                          <Users color="#fff" size={14} />
                          <Text style={styles.eventDetailText}>
                            {checkedInCount}/{attendees.length} asistentes
                          </Text>
                        </View>
                      </View>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    paddingBottom: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: '#fff',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  createButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  content: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600' as const,
    color: '#111827',
    marginTop: 24,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 24,
  },
  emptyButton: {
    marginTop: 32,
    backgroundColor: '#6366f1',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  eventsGrid: {
    padding: 16,
    gap: 16,
  },
  eventCard: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  eventImage: {
    width: '100%',
    height: 220,
    backgroundColor: '#e5e7eb',
  },
  eventGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 180,
    justifyContent: 'flex-end',
  },
  eventInfo: {
    padding: 16,
  },
  eventName: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 12,
    lineHeight: 28,
  },
  eventDetails: {
    gap: 6,
  },
  eventDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eventDetailText: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    flex: 1,
  },
});

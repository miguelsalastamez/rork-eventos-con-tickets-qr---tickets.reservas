import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Plus, Ticket as TicketIcon, Edit3, Trash2, DollarSign, Calendar, Users, Lock } from 'lucide-react-native';
import { useEvents } from '@/contexts/EventContext';
import { useUser } from '@/contexts/UserContext';

export default function TicketsManagementScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getEventById } = useEvents();
  const { canAccessFeature } = useUser();

  const event = getEventById(id);
  const hasTicketsAccess = canAccessFeature('hasEmailSupport');
  const primaryColor = event?.primaryColor || '#6366f1';

  const tickets: any[] = [];
  const capacityPools: any[] = [];
  const isLoading = false;

  const handleDelete = (ticketId: string) => {
    console.log('Delete ticket:', ticketId);
  };

  if (!hasTicketsAccess) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.lockedContainer}>
          <Lock color="#9ca3af" size={64} />
          <Text style={styles.lockedTitle}>Función Premium</Text>
          <Text style={styles.lockedText}>
            La gestión de tickets está disponible solo con suscripción PRO.
            Actualiza tu plan para acceder a esta funcionalidad.
          </Text>
          <TouchableOpacity
            style={[styles.upgradeButton, { backgroundColor: primaryColor }]}
            onPress={() => router.push('/subscription' as any)}
          >
            <Text style={styles.upgradeButtonText}>Actualizar a PRO</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleDeleteTicket = (ticketId: string, ticketName: string) => {
    Alert.alert(
      'Eliminar Ticket',
      `¿Estás seguro de que deseas eliminar "${ticketName}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            handleDelete(ticketId);
          },
        },
      ]
    );
  };

  const getCapacityInfo = (ticket: any) => {
    if (ticket.capacityType === 'unlimited') {
      return 'Capacidad Ilimitada';
    }
    
    if (ticket.capacityType === 'dedicated') {
      return `${ticket.soldCount} / ${ticket.dedicatedCapacity || 0} vendidos`;
    }
    
    if (ticket.capacityType === 'shared' && ticket.sharedCapacityPoolId) {
      const pool = capacityPools.find((p) => p.id === ticket.sharedCapacityPoolId);
      if (pool) {
        return `Pool compartido: ${pool.usedCapacity} / ${pool.totalCapacity}`;
      }
    }
    
    return 'Sin capacidad';
  };

  const isSaleActive = (ticket: any) => {
    const now = new Date();
    const start = new Date(ticket.saleStartDate);
    const end = new Date(ticket.saleEndDate);
    return now >= start && now <= end && ticket.isActive;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={primaryColor} />
          <Text style={styles.loadingText}>Cargando tickets...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Gestión de Tickets</Text>
            <Text style={styles.subtitle}>
              Configura los tickets disponibles para la venta
            </Text>
          </View>

          {capacityPools.length > 0 && (
            <View style={styles.poolsSection}>
              <Text style={styles.sectionTitle}>Pools de Capacidad</Text>
              {capacityPools.map((pool) => (
                <View key={pool.id} style={styles.poolCard}>
                  <View style={styles.poolInfo}>
                    <Text style={styles.poolName}>{pool.name}</Text>
                    <Text style={styles.poolCapacity}>
                      {pool.usedCapacity} / {pool.totalCapacity} utilizados
                    </Text>
                  </View>
                  <View style={styles.poolProgress}>
                    <View
                      style={[
                        styles.poolProgressBar,
                        {
                          width: `${(pool.usedCapacity / pool.totalCapacity) * 100}%`,
                          backgroundColor: primaryColor,
                        },
                      ]}
                    />
                  </View>
                </View>
              ))}
            </View>
          )}

          {tickets.length === 0 ? (
            <View style={styles.emptyState}>
              <TicketIcon color="#9ca3af" size={64} />
              <Text style={styles.emptyStateTitle}>No hay tickets configurados</Text>
              <Text style={styles.emptyStateText}>
                Crea tu primer ticket para empezar a vender entradas
              </Text>
            </View>
          ) : (
            <View style={styles.ticketsSection}>
              {tickets.map((ticket) => {
                const isActive = isSaleActive(ticket);
                return (
                  <View key={ticket.id} style={styles.ticketCard}>
                    {ticket.imageUrl && (
                      <Image
                        source={{ uri: ticket.imageUrl }}
                        style={styles.ticketImage}
                        resizeMode="cover"
                      />
                    )}
                    
                    <View style={styles.ticketContent}>
                      <View style={styles.ticketHeader}>
                        <View style={styles.ticketTitleRow}>
                          <Text style={styles.ticketName}>{ticket.name}</Text>
                          {isActive ? (
                            <View style={[styles.badge, { backgroundColor: '#10b981' }]}>
                              <Text style={styles.badgeText}>Activo</Text>
                            </View>
                          ) : (
                            <View style={[styles.badge, { backgroundColor: '#6b7280' }]}>
                              <Text style={styles.badgeText}>Inactivo</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.ticketDescription} numberOfLines={2}>
                          {ticket.description}
                        </Text>
                      </View>

                      <View style={styles.ticketDetails}>
                        <View style={styles.detailRow}>
                          <DollarSign color="#6b7280" size={16} />
                          <Text style={styles.detailText}>
                            ${ticket.price.toFixed(2)} {ticket.currency}
                          </Text>
                        </View>

                        <View style={styles.detailRow}>
                          <Users color="#6b7280" size={16} />
                          <Text style={styles.detailText}>
                            {getCapacityInfo(ticket)}
                          </Text>
                        </View>

                        <View style={styles.detailRow}>
                          <Calendar color="#6b7280" size={16} />
                          <Text style={styles.detailText}>
                            Venta: {new Date(ticket.saleStartDate).toLocaleDateString()} - {new Date(ticket.saleEndDate).toLocaleDateString()}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.ticketActions}>
                        <TouchableOpacity
                          style={[styles.actionButton, { borderColor: primaryColor }]}
                          onPress={() => router.push(`/event/${id}/tickets/edit?ticketId=${ticket.id}` as any)}
                        >
                          <Edit3 color={primaryColor} size={18} />
                          <Text style={[styles.actionButtonText, { color: primaryColor }]}>
                            Editar
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.actionButton, { borderColor: '#ef4444' }]}
                          onPress={() => handleDeleteTicket(ticket.id, ticket.name)}
                        >
                          <Trash2 color="#ef4444" size={18} />
                          <Text style={[styles.actionButtonText, { color: '#ef4444' }]}>
                            Eliminar
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.createButton, { backgroundColor: primaryColor }]}
          onPress={() => router.push(`/event/${id}/tickets/create` as any)}
        >
          <Plus color="#fff" size={24} />
          <Text style={styles.createButtonText}>Crear Ticket</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    padding: 20,
    gap: 24,
  },
  header: {
    gap: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#111827',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  poolsSection: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#111827',
  },
  poolCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  poolInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  poolName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#111827',
  },
  poolCapacity: {
    fontSize: 14,
    color: '#6b7280',
  },
  poolProgress: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  poolProgressBar: {
    height: '100%',
    borderRadius: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    gap: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: '#111827',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  ticketsSection: {
    gap: 16,
  },
  ticketCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  ticketImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#e5e7eb',
  },
  ticketContent: {
    padding: 20,
    gap: 16,
  },
  ticketHeader: {
    gap: 8,
  },
  ticketTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ticketName: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#111827',
    flex: 1,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#fff',
  },
  ticketDescription: {
    fontSize: 15,
    color: '#6b7280',
    lineHeight: 22,
  },
  ticketDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#6b7280',
  },
  ticketActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  footer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  lockedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    gap: 20,
  },
  lockedTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#111827',
  },
  lockedText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  upgradeButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: '#6b7280',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
});

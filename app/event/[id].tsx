import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  Pressable,
} from 'react-native';

import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import type { Ticket } from '@/types';
import { Calendar, MapPin, Users, UserPlus, QrCode, Trash2, Edit3, Settings, Gift, MessageSquare, Trophy, Map as MapIcon, X, Ticket as TicketIcon, Minus, Plus, AlertCircle } from 'lucide-react-native';
import { useEvents } from '@/contexts/EventContext';
import { useTickets } from '@/contexts/TicketContext';
import { useUser } from '@/contexts/UserContext';
import { canEditEvent, canDeleteEvent, canManageEventSettings, canManageAttendees, canManagePrizesAndRaffle, canSendMessages, canManageEventTickets, getUserRoleLabel } from '@/lib/permissions';
import { LinearGradient } from 'expo-linear-gradient';
import MediaViewer from '@/components/MediaViewer';

interface TicketCardProps {
  ticket: Ticket;
  eventId: string;
  primaryColor: string;
  onPurchase: (ticketId: string, quantity: number) => void;
}

function TicketCard({ ticket, primaryColor, onPurchase }: TicketCardProps) {
  const [quantity, setQuantity] = useState(1);

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handleIncrement = () => {
    setQuantity(quantity + 1);
  };

  const handleBuy = () => {
    onPurchase(ticket.id, quantity);
  };

  return (
    <View style={styles.ticketCard}>
      {ticket.imageUrl && (
        <Image
          source={{ uri: ticket.imageUrl }}
          style={styles.ticketCardImage}
          resizeMode="cover"
        />
      )}
      <View style={styles.ticketCardContent}>
        <Text style={styles.ticketCardName}>{ticket.name}</Text>
        <Text style={styles.ticketCardDescription} numberOfLines={2}>
          {ticket.description}
        </Text>
        <View style={styles.ticketCardFooter}>
          <Text style={[styles.ticketCardPrice, { color: primaryColor }]}>
            ${ticket.price.toFixed(2)} {ticket.currency}
          </Text>
        </View>
        <View style={styles.quantityContainer}>
          <TouchableOpacity
            style={[
              styles.quantityButton,
              { backgroundColor: `${primaryColor}20` },
              quantity <= 1 && styles.quantityButtonDisabled,
            ]}
            onPress={handleDecrement}
            disabled={quantity <= 1}
          >
            <Minus color={primaryColor} size={20} />
          </TouchableOpacity>
          <Text style={styles.quantityValue}>{quantity}</Text>
          <TouchableOpacity
            style={[
              styles.quantityButton,
              { backgroundColor: `${primaryColor}20` },
            ]}
            onPress={handleIncrement}
          >
            <Plus color={primaryColor} size={20} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.buyButton, { backgroundColor: primaryColor }]}
            onPress={handleBuy}
          >
            <Text style={styles.buyButtonText}>Comprar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export default function EventDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { events, attendees: allAttendees, deleteEvent, getEventRaffleWinners } = useEvents();
  const { getAvailableEventTickets } = useTickets();
  const { user, subscriptionTier, canAccessFeature } = useUser();
  const [venuePlanModalVisible, setVenuePlanModalVisible] = useState(false);

  const hasTicketsAccess = canAccessFeature('hasEmailSupport');

  const event = useMemo(() => events.find((e) => e.id === id), [events, id]);
  
  const userCanEdit = useMemo(() => event ? canEditEvent(event, user) : false, [event, user]);
  const userCanDelete = useMemo(() => event ? canDeleteEvent(event, user) : false, [event, user]);
  const userCanManageSettings = useMemo(() => event ? canManageEventSettings(event, user) : false, [event, user]);
  const userCanManageAttendees = useMemo(() => event ? canManageAttendees(event, user) : false, [event, user]);
  const userCanManageActivities = useMemo(() => event ? canManagePrizesAndRaffle(event, user) : false, [event, user]);
  const userCanSendMessages = useMemo(() => event ? canSendMessages(event, user) : false, [event, user]);
  const userCanManageTickets = useMemo(() => event ? canManageEventTickets(event, user) : false, [event, user]);
  const attendees = useMemo(() => allAttendees.filter((a) => a.eventId === id), [allAttendees, id]);
  const checkedInCount = attendees.filter(a => a.checkedIn).length;
  const raffleWinners = useMemo(() => getEventRaffleWinners(id), [getEventRaffleWinners, id]);
  const hasWinners = raffleWinners.length > 0;
  const availableTickets = useMemo(() => getAvailableEventTickets(id), [getAvailableEventTickets, id]);

  const primaryColor = event?.primaryColor || '#6366f1';
  const secondaryColor = event?.secondaryColor || '#8b5cf6';
  const backgroundColor = event?.backgroundColor || '#f9fafb';
  const textColor = event?.textColor || '#111827';

  const handleDelete = () => {
    Alert.alert(
      'Eliminar Evento',
      '¿Estás seguro de que deseas eliminar este evento? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await deleteEvent(id);
            router.back();
          },
        },
      ]
    );
  };

  if (!event) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Evento no encontrado</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <Stack.Screen options={{ title: event.name, headerShown: true }} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.imageContainer}>
          <MediaViewer uri={event.imageUrl} style={styles.image} resizeMode="cover" />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.imageGradient}
          />
        </View>

        {!userCanEdit && (
          <View style={styles.permissionBanner}>
            <AlertCircle color="#f59e0b" size={20} />
            <View style={styles.permissionBannerContent}>
              <Text style={styles.permissionBannerTitle}>Vista de solo lectura</Text>
              <Text style={styles.permissionBannerText}>
                Tu rol actual es: {user ? getUserRoleLabel(user.role) : 'Invitado'}. Solo puedes ver la información del evento.
              </Text>
            </View>
          </View>
        )}

        {availableTickets.length > 0 && hasTicketsAccess && (
          <View style={styles.ticketsSection}>
            <View style={styles.ticketsSectionHeader}>
              <TicketIcon color={primaryColor} size={24} />
              <Text style={styles.ticketsSectionTitle}>Tickets Disponibles</Text>
            </View>
            <Text style={styles.ticketsSectionSubtitle}>
              Compra tu entrada para este evento
            </Text>
            <View style={styles.ticketsList}>
              {availableTickets.map((ticket) => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  eventId={id}
                  primaryColor={primaryColor}
                  onPurchase={(ticketId, quantity) => {
                    router.push(`/event/${id}/buy-ticket?ticketId=${ticketId}&preselectedQuantity=${quantity}` as any);
                  }}
                />
              ))}
            </View>
          </View>
        )}

        <View style={styles.content}>
          <Text style={styles.eventName}>{event.name}</Text>

          {event.description ? (
            <Text style={styles.description}>{event.description}</Text>
          ) : null}

          {event.organizerLogoUrl && (
            <View style={styles.logoCard}>
              <Text style={styles.logoCardLabel}>Organizado por:</Text>
              <Image
                source={{ uri: event.organizerLogoUrl }}
                style={styles.organizerLogoLarge}
                resizeMode="contain"
              />
            </View>
          )}

          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <View style={[styles.iconCircle, { backgroundColor: `${primaryColor}15` }]}>
                <Calendar color={primaryColor} size={20} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Fecha y Hora</Text>
                <Text style={styles.detailValue}>
                  {new Date(event.date).toLocaleDateString('es-ES', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </Text>
                <Text style={styles.detailValue}>{event.time}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <View style={[styles.iconCircle, { backgroundColor: `${primaryColor}15` }]}>
                <MapPin color={primaryColor} size={20} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Ubicación</Text>
                <Text style={styles.detailValue}>{event.venueName}</Text>
                <Text style={styles.detailAddress}>{event.location}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <View style={[styles.iconCircle, { backgroundColor: `${primaryColor}15` }]}>
                <Users color={primaryColor} size={20} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Asistencia</Text>
                <Text style={styles.detailValue}>
                  {checkedInCount} de {attendees.length} registrados
                </Text>
              </View>
            </View>

            {hasWinners && (
              <>
                <View style={styles.divider} />
                <TouchableOpacity
                  style={styles.detailRow}
                  onPress={() => router.push(`/public/winners/${id}`)}
                >
                  <View style={[styles.iconCircle, { backgroundColor: `${primaryColor}15` }]}>
                    <Trophy color={primaryColor} size={20} />
                  </View>
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Ganadores de la Rifa</Text>
                    <Text style={[styles.detailValue, { color: primaryColor }]}>
                      Ver Ganadores de la Rifa
                    </Text>
                  </View>
                </TouchableOpacity>
              </>
            )}

            {event.venuePlanUrl && (
              <>
                <View style={styles.divider} />
                <View style={styles.detailRow}>
                  <View style={[styles.iconCircle, { backgroundColor: `${primaryColor}15` }]}>
                    <MapIcon color={primaryColor} size={20} />
                  </View>
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Plano del Evento</Text>
                    <TouchableOpacity 
                      onPress={() => setVenuePlanModalVisible(true)}
                      activeOpacity={0.8}
                    >
                      <Image
                        source={{ uri: event.venuePlanUrl }}
                        style={styles.venuePlanImage}
                        resizeMode="contain"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}
          </View>



          {userCanManageSettings && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Configuración</Text>
              
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => router.push(`/event/${id}/settings` as any)}
              >
                <View style={[styles.actionButtonIcon, { backgroundColor: `${primaryColor}15` }]}>
                  <Settings color={primaryColor} size={22} />
                </View>
                <View style={styles.actionButtonContent}>
                  <Text style={styles.actionButtonTitle}>Configuración del Evento</Text>
                  <Text style={styles.actionButtonSubtitle}>
                    Colores, sonidos, campos y más
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          )}

          {userCanSendMessages && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Comunicación</Text>
              
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => router.push(`/event/${id}/messaging` as any)}
              >
                <View style={[styles.actionButtonIcon, { backgroundColor: `${primaryColor}15` }]}>
                  <MessageSquare color={primaryColor} size={22} />
                </View>
                <View style={styles.actionButtonContent}>
                  <Text style={styles.actionButtonTitle}>Difusión del Evento</Text>
                  <Text style={styles.actionButtonSubtitle}>
                    Envía mensajes por email y WhatsApp
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          )}

          {userCanManageActivities && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Actividades</Text>
              
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => router.push(`/event/${id}/activities` as any)}
              >
                <View style={[styles.actionButtonIcon, { backgroundColor: `${primaryColor}15` }]}>
                  <Gift color={primaryColor} size={22} />
                </View>
                <View style={styles.actionButtonContent}>
                  <Text style={styles.actionButtonTitle}>Actividades para Invitados</Text>
                  <Text style={styles.actionButtonSubtitle}>
                    Sorteos, dinámicas y más
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Gestión de Invitados</Text>
            
            {userCanManageAttendees && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => router.push(`/event/${id}/add-attendees` as any)}
              >
                <View style={[styles.actionButtonIcon, { backgroundColor: `${primaryColor}15` }]}>
                  <UserPlus color={primaryColor} size={22} />
                </View>
                <View style={styles.actionButtonContent}>
                  <Text style={styles.actionButtonTitle}>Agregar Invitados</Text>
                  <Text style={styles.actionButtonSubtitle}>
                    Registra personas manualmente o por lote
                  </Text>
                </View>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push(`/event/${id}/attendees` as any)}
            >
              <View style={[styles.actionButtonIcon, { backgroundColor: `${primaryColor}15` }]}>
                <Users color={primaryColor} size={22} />
              </View>
              <View style={styles.actionButtonContent}>
                <Text style={styles.actionButtonTitle}>Ver Lista de Invitados</Text>
                <Text style={styles.actionButtonSubtitle}>
                  {attendees.length} personas registradas
                </Text>
              </View>
            </TouchableOpacity>

            {userCanManageAttendees && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => router.push('/scan-qr' as any)}
              >
                <View style={[styles.actionButtonIcon, { backgroundColor: `${primaryColor}15` }]}>
                  <QrCode color={primaryColor} size={22} />
                </View>
                <View style={styles.actionButtonContent}>
                  <Text style={styles.actionButtonTitle}>Escanear QR</Text>
                  <Text style={styles.actionButtonSubtitle}>
                    Valida el acceso de invitados
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          </View>

          {userCanEdit && (
            <TouchableOpacity
              style={[styles.editButton, { backgroundColor: primaryColor }]}
              onPress={() => router.push(`/event/${id}/edit` as any)}
            >
              <Edit3 color="#fff" size={20} />
              <Text style={styles.editButtonText}>Editar Evento</Text>
            </TouchableOpacity>
          )}

          {userCanDelete && (
            <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
              <Trash2 color="#ef4444" size={20} />
              <Text style={styles.deleteButtonText}>Eliminar Evento</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={venuePlanModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setVenuePlanModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <Pressable 
            style={styles.modalBackdrop} 
            onPress={() => setVenuePlanModalVisible(false)}
          />
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={[styles.modalCloseButton, { backgroundColor: primaryColor }]}
              onPress={() => setVenuePlanModalVisible(false)}
            >
              <X color="#fff" size={24} />
            </TouchableOpacity>
            <Image
              source={{ uri: event.venuePlanUrl }}
              style={styles.modalImage}
              resizeMode="contain"
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  errorText: {
    fontSize: 16,
    color: '#6b7280',
  },
  imageContainer: {
    height: 280,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: '#e5e7eb',
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  content: {
    padding: 20,
    gap: 24,
  },
  eventName: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#111827',
    lineHeight: 36,
  },
  description: {
    fontSize: 16,
    color: '#6b7280',
    lineHeight: 24,
  },
  logoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  logoCardLabel: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#6b7280',
  },
  organizerLogoLarge: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: '#f9fafb',
  },
  detailsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  detailRow: {
    flexDirection: 'row',
    gap: 16,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailContent: {
    flex: 1,
    gap: 4,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#6b7280',
  },
  detailValue: {
    fontSize: 16,
    color: '#111827',
    textTransform: 'capitalize' as const,
  },
  detailAddress: {
    fontSize: 15,
    color: '#6b7280',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: '#111827',
    marginBottom: 4,
  },
  actionButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButtonIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonContent: {
    flex: 1,
    gap: 4,
  },
  actionButtonTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#111827',
  },
  actionButtonSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#fecaca',
    marginTop: 8,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#ef4444',
  },
  ticketsSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 16,
    borderBottomWidth: 8,
    borderBottomColor: '#f3f4f6',
  },
  ticketsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ticketsSectionTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: '#111827',
  },
  ticketsSectionSubtitle: {
    fontSize: 15,
    color: '#6b7280',
  },
  ticketsList: {
    gap: 12,
  },
  ticketCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  ticketCardImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#e5e7eb',
  },
  ticketCardContent: {
    padding: 16,
    gap: 8,
  },
  ticketCardName: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#111827',
  },
  ticketCardDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  ticketCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  ticketCardPrice: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  ticketCardButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  ticketCardButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#fff',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
  },
  quantityButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonDisabled: {
    opacity: 0.4,
  },
  quantityValue: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#111827',
    minWidth: 30,
    textAlign: 'center' as const,
  },
  buyButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#fff',
  },
  venuePlanImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    marginTop: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  modalContent: {
    width: '90%',
    height: '80%',
    position: 'relative',
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
  modalCloseButton: {
    position: 'absolute',
    top: -50,
    right: 0,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  permissionBanner: {
    backgroundColor: '#fef3c7',
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 8,
  },
  permissionBannerContent: {
    flex: 1,
    gap: 4,
  },
  permissionBannerTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#92400e',
  },
  permissionBannerText: {
    fontSize: 13,
    color: '#78350f',
    lineHeight: 18,
  },
});

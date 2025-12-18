import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Platform,
  Alert,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { Trophy, ArrowLeft, Share2 } from 'lucide-react-native';
import { useEvents } from '@/contexts/EventContext';

export default function PublicWinnersScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const {
    getEventById,
    getEventRaffleWinners,
    getEventPrizes,
    getEventAttendees,
  } = useEvents();

  const event = getEventById(id);
  const winners = useMemo(() => getEventRaffleWinners(id), [getEventRaffleWinners, id]);
  const prizes = useMemo(() => getEventPrizes(id), [getEventPrizes, id]);
  const attendees = useMemo(() => getEventAttendees(id), [getEventAttendees, id]);

  const primaryColor = event?.primaryColor || '#6366f1';
  const backgroundColor = event?.backgroundColor || '#f9fafb';
  const textColor = event?.textColor || '#111827';

  const winnersWithDetails = useMemo(() => {
    return winners.map((winner) => {
      const prize = prizes.find((p) => p.id === winner.prizeId);
      const attendee = attendees.find((a) => a.id === winner.attendeeId);
      return {
        ...winner,
        prize,
        attendee,
      };
    });
  }, [winners, prizes, attendees]);

  if (!event) {
    return (
      <>
        <Stack.Screen options={{ title: 'Ganadores del Sorteo', headerShown: false }} />
        <SafeAreaView style={[styles.container, { backgroundColor }]}>
          <View style={styles.emptyState}>
            <Trophy color="#9ca3af" size={64} />
            <Text style={styles.emptyText}>Evento no encontrado</Text>
          </View>
        </SafeAreaView>
      </>
    );
  }

  if (winners.length === 0) {
    return (
      <>
        <Stack.Screen options={{ title: 'Ganadores del Sorteo', headerShown: false }} />
        <SafeAreaView style={[styles.container, { backgroundColor }]}>
          <View style={styles.emptyState}>
            <Trophy color="#9ca3af" size={64} />
            <Text style={styles.emptyText}>No hay ganadores aún</Text>
            <Text style={styles.emptySubtext}>
              El sorteo aún no se ha realizado
            </Text>
          </View>
        </SafeAreaView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Ganadores del Sorteo', headerShown: false }} />
      <View style={[styles.outerContainer, { backgroundColor: primaryColor }]}>
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
          <ScrollView 
            style={styles.scrollView} 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.topBar}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
                activeOpacity={0.7}
              >
                <ArrowLeft color="#fff" size={24} />
                <Text style={styles.backButtonText}>Regresar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.shareButton}
                onPress={async () => {
                  const url = Platform.select({
                    web: window.location.href,
                    default: `https://rork.com/public/winners/${id}`,
                  });
                  
                  try {
                    if (Platform.OS === 'web') {
                      await navigator.clipboard.writeText(url);
                      Alert.alert('Éxito', 'URL copiada al portapapeles');
                    } else {
                      await Share.share({
                        message: `Ganadores del Sorteo - ${event?.name || 'Evento'}\n${url}`,
                        url,
                      });
                    }
                  } catch (error) {
                    console.error('Error sharing:', error);
                  }
                }}
                activeOpacity={0.7}
              >
                <Share2 color="#fff" size={24} />
                <Text style={styles.shareButtonText}>Compartir</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.logoContainer}>
              {event.organizerLogoUrl ? (
                <Image 
                  source={{ uri: event.organizerLogoUrl }} 
                  style={styles.logo}
                  resizeMode="contain"
                />
              ) : null}
            </View>

            <View style={[styles.headerCard, { borderColor: primaryColor }]}>
              <Text style={[styles.mainTitle, { color: primaryColor }]}>
                COMUNICADO DE SORTEO
              </Text>
              <Text style={[styles.eventName, { color: textColor }]}>
                {event.name}
              </Text>
              <Text style={styles.eventDate}>
                {new Date(event.date).toLocaleDateString('es-MX', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </Text>
              {event.location ? (
                <Text style={styles.eventLocation}>{event.location}</Text>
              ) : null}
            </View>

            <View style={styles.winnersSection}>
              <Text style={[styles.sectionTitle, { color: primaryColor }]}>
                GANADORES DEL SORTEO
              </Text>
              <Text style={styles.winnersCount}>
                {winners.length} ganador{winners.length !== 1 ? 'es' : ''}
              </Text>
            </View>

            <View style={styles.cardsContainer}>
              {winnersWithDetails.map((winner, index) => (
                <View 
                  key={winner.id} 
                  style={styles.winnerCard}
                >
                  <View style={styles.cardHeader}>
                    <View style={[styles.prizeNumber, { backgroundColor: primaryColor }]}>
                      <Text style={styles.prizeNumberText}>#{index + 1}</Text>
                    </View>
                    <View style={styles.winnerInfo}>
                      <Text style={styles.winnerLabel}>GANADOR</Text>
                      <Text style={[styles.winnerName, { color: textColor }]}>
                        {winner.attendeeName}
                      </Text>
                    </View>
                  </View>

                  {winner.prize?.imageUrl ? (
                    <Image 
                      source={{ uri: winner.prize.imageUrl }} 
                      style={styles.cardPrizeImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.cardNoImagePlaceholder}>
                      <Trophy color="#d1d5db" size={80} />
                      <Text style={styles.cardNoImageText}>Sin imagen</Text>
                    </View>
                  )}

                  <View style={styles.cardContent}>
                    <Text style={[styles.cardPrizeName, { color: primaryColor }]}>
                      {winner.prizeName}
                    </Text>
                    <Text style={styles.cardPrizeDescription}>
                      {winner.prize?.description || 'Sin descripción'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.footer}>
              <Text style={styles.appName}>EventPass</Text>
              <Text style={styles.appTagline}>by Rork</Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    flex: 1,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.3)',
    flex: 1,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 120,
    height: 120,
  },
  headerCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 4,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    letterSpacing: 1,
    marginBottom: 16,
    textAlign: 'center',
  },
  eventName: {
    fontSize: 32,
    fontWeight: '700' as const,
    marginBottom: 8,
    textAlign: 'center',
  },
  eventDate: {
    fontSize: 18,
    color: '#6b7280',
    marginBottom: 4,
    textAlign: 'center',
  },
  eventLocation: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
  },
  winnersSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    marginBottom: 8,
    textAlign: 'center',
  },
  winnersCount: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  cardsContainer: {
    gap: 20,
    marginBottom: 32,
  },
  winnerCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  prizeNumber: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  prizeNumberText: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: '#fff',
  },
  winnerInfo: {
    flex: 1,
  },
  winnerLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#9ca3af',
    letterSpacing: 1,
    marginBottom: 4,
  },
  winnerName: {
    fontSize: 24,
    fontWeight: '700' as const,
  },
  cardPrizeImage: {
    width: '100%',
    height: 300,
    backgroundColor: '#f3f4f6',
  },
  cardNoImagePlaceholder: {
    width: '100%',
    height: 300,
    backgroundColor: '#f9fafb',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  cardNoImageText: {
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '600' as const,
  },
  cardContent: {
    padding: 24,
  },
  cardPrizeName: {
    fontSize: 28,
    fontWeight: '700' as const,
    marginBottom: 12,
  },
  cardPrizeDescription: {
    fontSize: 16,
    color: '#6b7280',
    lineHeight: 24,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 16,
    borderTopWidth: 2,
    borderTopColor: 'rgba(255,255,255,0.3)',
  },
  appName: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 4,
  },
  appTagline: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#6b7280',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
});

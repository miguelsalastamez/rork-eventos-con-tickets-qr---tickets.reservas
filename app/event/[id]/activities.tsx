import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Gift, Trophy } from 'lucide-react-native';
import { useEvents } from '@/contexts/EventContext';

export default function ActivitiesScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getEventById } = useEvents();
  const event = getEventById(id);

  const primaryColor = event?.primaryColor || '#6366f1';
  const backgroundColor = event?.backgroundColor || '#f9fafb';

  return (
    <>
      <Stack.Screen options={{ title: 'Actividades' }} />
      <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.title}>Actividades para Invitados</Text>
          <Text style={styles.subtitle}>
            Gestiona sorteos, dinámicas y actividades especiales
          </Text>

          <TouchableOpacity
            style={styles.activityButton}
            onPress={() => router.push(`/event/${id}/raffle/prizes` as any)}
          >
            <View style={[styles.activityIcon, { backgroundColor: `${primaryColor}15` }]}>
              <Gift color={primaryColor} size={28} />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>Sorteo para Asistentes</Text>
              <Text style={styles.activityDescription}>
                Gestiona premios y realiza sorteos en tiempo real
              </Text>
            </View>
          </TouchableOpacity>

          <View style={styles.comingSoonCard}>
            <Trophy color="#9ca3af" size={24} />
            <Text style={styles.comingSoonText}>
              Más actividades próximamente
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#111827',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    lineHeight: 24,
    marginTop: -8,
  },
  activityButton: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginTop: 12,
  },
  activityIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityContent: {
    flex: 1,
    gap: 4,
  },
  activityTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#111827',
  },
  activityDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  comingSoonCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    gap: 12,
    marginTop: 20,
  },
  comingSoonText: {
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '500' as const,
  },
});

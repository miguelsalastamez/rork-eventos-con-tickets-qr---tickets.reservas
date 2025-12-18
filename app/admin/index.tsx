import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Building2, Users, TrendingUp, DollarSign, Package, UserCheck, Database } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useUser } from '@/contexts/UserContext';
import { useEvents } from '@/contexts/EventContext';

export default function AdminDashboardScreen() {
  const router = useRouter();
  const { user, organizations } = useUser();
  const { events, attendees } = useEvents();

  if (user?.role !== 'super_admin') {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Acceso denegado</Text>
      </View>
    );
  }

  const totalRevenue = organizations.length * 10;
  const activeSubscriptions = organizations.length;

  const stats = [
    {
      label: 'Organizaciones',
      value: organizations.length,
      icon: Building2,
      color: '#6366f1',
      route: '/admin/organizations',
    },
    {
      label: 'Eventos Totales',
      value: events.length,
      icon: Package,
      color: '#8b5cf6',
      route: '/admin/events',
    },
    {
      label: 'Participantes',
      value: attendees.length,
      icon: Users,
      color: '#ec4899',
      route: '/admin/users',
    },
    {
      label: 'Ingresos (MRR)',
      value: `$${totalRevenue}`,
      icon: DollarSign,
      color: '#10b981',
      route: '/admin/revenue',
    },
    {
      label: 'Suscripciones Activas',
      value: activeSubscriptions,
      icon: TrendingUp,
      color: '#f59e0b',
      route: '/admin/subscriptions',
    },
  ];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#111827', '#1f2937']}
        style={styles.header}
      >
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.headerTitle}>Panel de Admin</Text>
              <Text style={styles.headerSubtitle}>Administración General</Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statsGrid}>
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <TouchableOpacity
                key={index}
                style={styles.statCard}
                onPress={() => router.push(stat.route as any)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconContainer, { backgroundColor: `${stat.color}20` }]}>
                  <Icon color={stat.color} size={24} />
                </View>
                <View style={styles.statContent}>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
          <View style={styles.actionsList}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/admin/organizations' as any)}
            >
              <Building2 color="#6366f1" size={20} />
              <Text style={styles.actionButtonText}>Gestionar Organizaciones</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/admin/users' as any)}
            >
              <Users color="#6366f1" size={20} />
              <Text style={styles.actionButtonText}>Ver Usuarios</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/admin/events' as any)}
            >
              <Package color="#6366f1" size={20} />
              <Text style={styles.actionButtonText}>Ver Todos los Eventos</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/admin/test-users' as any)}
            >
              <UserCheck color="#10b981" size={20} />
              <Text style={styles.actionButtonText}>Usuarios de Prueba</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.testDataButton]}
              onPress={() => router.push('/admin/test-data' as any)}
            >
              <Database color="#3b82f6" size={20} />
              <Text style={styles.actionButtonText}>Gestión de Datos de Prueba</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
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
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  statsGrid: {
    padding: 16,
    gap: 12,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#111827',
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 8,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#111827',
    marginBottom: 16,
  },
  actionsList: {
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: '#374151',
    flex: 1,
  },
  testDataButton: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  errorText: {
    fontSize: 18,
    color: '#ef4444',
    textAlign: 'center',
    marginTop: 40,
  },
});

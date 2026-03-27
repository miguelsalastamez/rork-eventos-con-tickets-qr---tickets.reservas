import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ShoppingBag, Ticket, Download } from 'lucide-react-native';
import { useUser } from '@/contexts/UserContext';

export default function MyPurchasesScreen() {
  const router = useRouter();
  const { user } = useUser();

  const purchases: any[] = [];
  const isLoading = false;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando tus compras...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (purchases.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.emptyContainer}>
          <ShoppingBag color="#9ca3af" size={64} />
          <Text style={styles.emptyTitle}>No tienes compras</Text>
          <Text style={styles.emptyText}>
            Cuando compres tickets, aparecerán aquí
          </Text>
          <TouchableOpacity 
            style={styles.browseButton}
            onPress={() => router.push('/' as any)}
          >
            <Text style={styles.browseButtonText}>Explorar eventos</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mis tickets</Text>
          <Text style={styles.headerSubtitle}>
            {purchases.length} {purchases.length === 1 ? 'compra' : 'compras'}
          </Text>
        </View>

        <View style={styles.purchasesList}>
          {purchases.map((purchase: any) => (
            <TouchableOpacity 
              key={purchase.id}
              style={styles.purchaseCard}
              activeOpacity={0.7}
            >
              <View style={styles.purchaseHeader}>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>
                    {purchase.status === 'completed' ? 'Confirmado' : 
                     purchase.status === 'pending' ? 'Pendiente' : 
                     purchase.status === 'awaiting_transfer_confirmation' ? 'En revisión' : 
                     purchase.status === 'failed' ? 'Fallido' : 'Desconocido'}
                  </Text>
                </View>
                <Text style={styles.purchaseDate}>
                  {new Date(purchase.purchasedAt).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </Text>
              </View>

              <View style={styles.purchaseBody}>
                <View style={styles.ticketInfo}>
                  <Text style={styles.ticketName}>{purchase.ticketName}</Text>
                  <View style={styles.ticketDetails}>
                    <View style={styles.detailRow}>
                      <Ticket color="#6b7280" size={16} />
                      <Text style={styles.detailText}>
                        {purchase.quantity} {purchase.quantity === 1 ? 'ticket' : 'tickets'}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.priceContainer}>
                  <Text style={styles.priceLabel}>Total</Text>
                  <Text style={styles.price}>
                    ${purchase.totalAmount.toFixed(2)} {purchase.currency}
                  </Text>
                </View>
              </View>

              <View style={styles.purchaseFooter}>
                <TouchableOpacity style={styles.actionButton}>
                  <Download color="#6366f1" size={18} />
                  <Text style={styles.actionButtonText}>Descargar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <Ticket color="#6366f1" size={18} />
                  <Text style={styles.actionButtonText}>Ver detalles</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600' as const,
    color: '#111827',
    marginTop: 24,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  browseButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  browseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  purchasesList: {
    padding: 16,
    gap: 16,
  },
  purchaseCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  purchaseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#16a34a',
  },
  purchaseDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  purchaseBody: {
    marginBottom: 16,
  },
  ticketInfo: {
    marginBottom: 12,
  },
  ticketName: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#111827',
    marginBottom: 8,
  },
  ticketDetails: {
    gap: 6,
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
  priceContainer: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  priceLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  price: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#111827',
  },
  purchaseFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f0f9ff',
    gap: 6,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#6366f1',
  },
});

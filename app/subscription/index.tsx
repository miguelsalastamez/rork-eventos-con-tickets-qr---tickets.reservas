import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { X, Check, Zap, Crown, TrendingUp } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useUser } from '@/contexts/UserContext';

export default function SubscriptionScreen() {
  const router = useRouter();
  const { subscriptionTier, updateSubscriptionTier, featureLimits } = useUser();

  const handleUpgradeToPro = () => {
    Alert.alert(
      '¿Actualizar a Pro?',
      'Obtendrás acceso ilimitado a todas las funciones por $10 USD al mes.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Actualizar',
          onPress: async () => {
            await updateSubscriptionTier('pro');
            Alert.alert(
              '¡Bienvenido a Pro!',
              'Ahora tienes acceso completo a todas las funciones premium.'
            );
          },
        },
      ]
    );
  };

  const handleDowngradeToFree = () => {
    Alert.alert(
      '¿Volver a plan gratuito?',
      'Perderás acceso a las funciones premium.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          style: 'destructive',
          onPress: async () => {
            await updateSubscriptionTier('free');
            Alert.alert('Plan actualizado', 'Has vuelto al plan gratuito.');
          },
        },
      ]
    );
  };

  const freeFeatures = [
    { text: '1 evento activo', available: true },
    { text: 'Hasta 50 asistentes por evento', available: true },
    { text: 'Gestión básica de tickets', available: true },
    { text: 'Sorteos y premios', available: true },
    { text: 'Soporte por email', available: false },
    { text: 'Notificaciones WhatsApp', available: false },
    { text: 'Reportes avanzados', available: false },
    { text: 'Marca personalizada', available: false },
  ];

  const proFeatures = [
    { text: 'Eventos ilimitados', available: true },
    { text: 'Asistentes ilimitados', available: true },
    { text: 'Gestión avanzada de tickets', available: true },
    { text: 'Sorteos y premios', available: true },
    { text: 'Soporte prioritario', available: true },
    { text: 'Notificaciones por Email', available: true },
    { text: 'Notificaciones por WhatsApp', available: true },
    { text: 'Reportes avanzados', available: true },
    { text: 'Marca personalizada', available: true },
  ];

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <X color="#111827" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Suscripción</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.currentPlanCard}>
          <View style={styles.currentPlanHeader}>
            <View style={styles.planBadge}>
              <Text style={styles.planBadgeText}>Plan Actual</Text>
            </View>
            <View style={styles.currentPlanInfo}>
              <Text style={styles.currentPlanName}>
                {subscriptionTier === 'pro' ? 'Pro' : 'Gratuito'}
              </Text>
              {subscriptionTier === 'pro' ? (
                <Crown color="#f59e0b" size={24} />
              ) : (
                <Zap color="#6366f1" size={24} />
              )}
            </View>
          </View>

          <View style={styles.usageStats}>
            <View style={styles.usageStat}>
              <Text style={styles.usageLabel}>Eventos</Text>
              <Text style={styles.usageValue}>
                {featureLimits.maxEvents === 999999 ? '∞' : `0/${featureLimits.maxEvents}`}
              </Text>
            </View>
            <View style={styles.usageStat}>
              <Text style={styles.usageLabel}>Asistentes/Evento</Text>
              <Text style={styles.usageValue}>
                {featureLimits.maxAttendeesPerEvent === 999999
                  ? '∞'
                  : `0/${featureLimits.maxAttendeesPerEvent}`}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.plans}>
          <View style={styles.planCard}>
            <View style={styles.planHeader}>
              <Text style={styles.planName}>Plan Gratuito</Text>
              <View style={styles.priceContainer}>
                <Text style={styles.price}>$0</Text>
                <Text style={styles.pricePeriod}>/mes</Text>
              </View>
            </View>

            <View style={styles.features}>
              {freeFeatures.map((feature, index) => (
                <View key={index} style={styles.feature}>
                  {feature.available ? (
                    <Check color="#10b981" size={20} />
                  ) : (
                    <X color="#d1d5db" size={20} />
                  )}
                  <Text
                    style={[
                      styles.featureText,
                      !feature.available && styles.featureTextDisabled,
                    ]}
                  >
                    {feature.text}
                  </Text>
                </View>
              ))}
            </View>

            {subscriptionTier === 'pro' && (
              <TouchableOpacity
                style={styles.downgradeButton}
                onPress={handleDowngradeToFree}
              >
                <Text style={styles.downgradeButtonText}>Cambiar a Gratuito</Text>
              </TouchableOpacity>
            )}
          </View>

          <LinearGradient
            colors={['#6366f1', '#8b5cf6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.planCard}
          >
            <View style={styles.proHeader}>
              <View style={styles.proBadge}>
                <Crown color="#fff" size={16} />
                <Text style={styles.proBadgeText}>POPULAR</Text>
              </View>
            </View>

            <View style={styles.planHeader}>
              <Text style={styles.planNamePro}>Plan Pro</Text>
              <View style={styles.priceContainer}>
                <Text style={styles.pricePro}>$10</Text>
                <Text style={styles.pricePeriodPro}>/mes</Text>
              </View>
            </View>

            <Text style={styles.proDescription}>
              Acceso completo a todas las funciones. Sin límites.
            </Text>

            <View style={styles.features}>
              {proFeatures.map((feature, index) => (
                <View key={index} style={styles.feature}>
                  <Check color="#fff" size={20} />
                  <Text style={styles.featureTextPro}>{feature.text}</Text>
                </View>
              ))}
            </View>

            {subscriptionTier === 'free' ? (
              <TouchableOpacity style={styles.upgradeButton} onPress={handleUpgradeToPro}>
                <TrendingUp color="#6366f1" size={20} />
                <Text style={styles.upgradeButtonText}>Actualizar a Pro</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.currentPlanIndicator}>
                <Check color="#fff" size={20} />
                <Text style={styles.currentPlanIndicatorText}>Plan Actual</Text>
              </View>
            )}
          </LinearGradient>
        </View>

        <View style={styles.faq}>
          <Text style={styles.faqTitle}>Preguntas Frecuentes</Text>
          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>¿Puedo cancelar en cualquier momento?</Text>
            <Text style={styles.faqAnswer}>
              Sí, puedes cancelar tu suscripción en cualquier momento sin cargos adicionales.
            </Text>
          </View>
          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>¿Qué pasa con mis datos si cancelo?</Text>
            <Text style={styles.faqAnswer}>
              Tus datos permanecen seguros. Puedes acceder a ellos en cualquier momento con el
              plan gratuito.
            </Text>
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
  safeArea: {
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#111827',
  },
  content: {
    flex: 1,
  },
  currentPlanCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  currentPlanHeader: {
    marginBottom: 16,
  },
  planBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#eef2ff',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  planBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#6366f1',
  },
  currentPlanInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  currentPlanName: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#111827',
  },
  usageStats: {
    flexDirection: 'row',
    gap: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  usageStat: {
    flex: 1,
  },
  usageLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  usageValue: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: '#111827',
  },
  plans: {
    padding: 16,
    gap: 16,
  },
  planCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  proHeader: {
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  proBadgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#fff',
  },
  planHeader: {
    marginBottom: 16,
  },
  planName: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#111827',
    marginBottom: 8,
  },
  planNamePro: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontSize: 48,
    fontWeight: '700' as const,
    color: '#111827',
  },
  pricePeriod: {
    fontSize: 16,
    color: '#6b7280',
    marginLeft: 4,
  },
  pricePro: {
    fontSize: 48,
    fontWeight: '700' as const,
    color: '#fff',
  },
  pricePeriodPro: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginLeft: 4,
  },
  proDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 20,
  },
  features: {
    gap: 12,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 15,
    color: '#374151',
    flex: 1,
  },
  featureTextDisabled: {
    color: '#9ca3af',
  },
  featureTextPro: {
    fontSize: 15,
    color: '#fff',
    flex: 1,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#6366f1',
  },
  downgradeButton: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  downgradeButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#6b7280',
  },
  currentPlanIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    marginTop: 20,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 12,
  },
  currentPlanIndicatorText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  faq: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 8,
    padding: 20,
    borderRadius: 16,
  },
  faqTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: '#111827',
    marginBottom: 16,
  },
  faqItem: {
    marginBottom: 16,
  },
  faqQuestion: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#111827',
    marginBottom: 6,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
});

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { CreditCard, FileText, Loader } from 'lucide-react-native';
import { useTickets } from '@/contexts/TicketContext';
import { useEvents } from '@/contexts/EventContext';
import { PaymentMethod } from '@/types';

export default function BuyTicketScreen() {
  const router = useRouter();
  const { id, ticketId, preselectedQuantity } = useLocalSearchParams<{ id: string; ticketId: string; preselectedQuantity?: string }>();
  const {
    tickets,
    addPurchase,
    createOrGetBuyer,
    addPurchaseToBuyer,
  } = useTickets();
  const { getEventById } = useEvents();

  const event = getEventById(id);
  const ticket = useMemo(() => tickets.find((t) => t.id === ticketId), [tickets, ticketId]);

  const [quantity, setQuantity] = useState<string>(preselectedQuantity || '1');
  const [buyerFullName, setBuyerFullName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('stripe');
  const [isProcessing, setIsProcessing] = useState(false);

  const primaryColor = event?.primaryColor || '#6366f1';

  const totalAmount = useMemo(() => {
    if (!ticket) return 0;
    return ticket.price * parseInt(quantity || '1', 10);
  }, [ticket, quantity]);

  const handleFormFieldChange = (fieldId: string, value: any) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
  };

  const validateForm = () => {
    if (!buyerFullName.trim()) {
      Alert.alert('Error', 'Por favor ingresa tu nombre completo');
      return false;
    }

    if (!buyerEmail.trim() || !buyerEmail.includes('@')) {
      Alert.alert('Error', 'Por favor ingresa un email válido');
      return false;
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty < 1) {
      Alert.alert('Error', 'La cantidad debe ser al menos 1');
      return false;
    }

    if (ticket?.formFields) {
      for (const field of ticket.formFields) {
        if (field.required && !formData[field.id]) {
          Alert.alert('Error', `El campo "${field.label}" es requerido`);
          return false;
        }
      }
    }

    return true;
  };

  const handlePurchaseWithStripe = async () => {
    if (!validateForm() || !ticket) return;

    setIsProcessing(true);

    try {
      const buyer = await createOrGetBuyer(
        buyerEmail.trim(),
        buyerFullName.trim(),
        buyerPhone.trim() || undefined
      );

      const purchase = {
        id: `purchase-${Date.now()}`,
        eventId: id,
        ticketId: ticket.id,
        ticketName: ticket.name,
        quantity: parseInt(quantity, 10),
        unitPrice: ticket.price,
        totalAmount,
        currency: ticket.currency,
        buyerEmail: buyerEmail.trim(),
        buyerFullName: buyerFullName.trim(),
        buyerPhone: buyerPhone.trim() || undefined,
        formData,
        paymentMethod: 'stripe' as PaymentMethod,
        paymentIntentId: `pi_demo_${Date.now()}`,
        status: 'completed' as const,
        purchasedAt: new Date().toISOString(),
        confirmedAt: new Date().toISOString(),
        userId: buyer.id,
      };

      await addPurchase(purchase);
      await addPurchaseToBuyer(buyer.email, purchase.id);

      Alert.alert(
        '¡Compra Exitosa!',
        `Tu cuenta ha sido creada. Revisa tu email (${buyer.email}) para los detalles de acceso y tu ticket.${
          buyer.temporaryPassword ? `\n\nContraseña temporal: ${buyer.temporaryPassword}` : ''
        }`,
        [
          {
            text: 'OK',
            onPress: () => router.push(`/event/${id}` as any),
          },
        ]
      );
    } catch (error) {
      console.error('Error processing purchase:', error);
      Alert.alert('Error', 'No se pudo procesar la compra. Por favor intenta de nuevo.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePurchaseWithTransfer = async () => {
    if (!validateForm() || !ticket) return;

    setIsProcessing(true);

    try {
      const buyer = await createOrGetBuyer(
        buyerEmail.trim(),
        buyerFullName.trim(),
        buyerPhone.trim() || undefined
      );

      const purchase = {
        id: `purchase-${Date.now()}`,
        eventId: id,
        ticketId: ticket.id,
        ticketName: ticket.name,
        quantity: parseInt(quantity, 10),
        unitPrice: ticket.price,
        totalAmount,
        currency: ticket.currency,
        buyerEmail: buyerEmail.trim(),
        buyerFullName: buyerFullName.trim(),
        buyerPhone: buyerPhone.trim() || undefined,
        formData,
        paymentMethod: 'transfer' as PaymentMethod,
        status: 'awaiting_transfer_confirmation' as const,
        purchasedAt: new Date().toISOString(),
        userId: buyer.id,
      };

      await addPurchase(purchase);
      await addPurchaseToBuyer(buyer.email, purchase.id);

      Alert.alert(
        'Compra Pendiente',
        `Tu pedido ha sido registrado. Por favor realiza la transferencia y envía el comprobante.\n\nMonto a transferir: $${totalAmount.toFixed(2)} ${ticket.currency}\n\nTu cuenta ha sido creada. Email: ${buyer.email}${
          buyer.temporaryPassword ? `\nContraseña temporal: ${buyer.temporaryPassword}` : ''
        }`,
        [
          {
            text: 'OK',
            onPress: () => router.push(`/event/${id}` as any),
          },
        ]
      );
    } catch (error) {
      console.error('Error processing purchase:', error);
      Alert.alert('Error', 'No se pudo registrar la compra. Por favor intenta de nuevo.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePurchase = () => {
    if (paymentMethod === 'stripe') {
      handlePurchaseWithStripe();
    } else {
      handlePurchaseWithTransfer();
    }
  };

  if (!ticket || !event) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Ticket no encontrado</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.form}>
            <View style={styles.ticketSummary}>
              <Text style={styles.ticketName}>{ticket.name}</Text>
              <Text style={styles.ticketDescription}>{ticket.description}</Text>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Precio:</Text>
                <Text style={[styles.priceValue, { color: primaryColor }]}>
                  ${ticket.price.toFixed(2)} {ticket.currency}
                </Text>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Cantidad *</Text>
              <TextInput
                style={styles.input}
                value={quantity}
                onChangeText={setQuantity}
                placeholder="1"
                placeholderTextColor="#9ca3af"
                keyboardType="number-pad"
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Datos del Comprador</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nombre Completo *</Text>
                <TextInput
                  style={styles.input}
                  value={buyerFullName}
                  onChangeText={setBuyerFullName}
                  placeholder="Juan Pérez"
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email *</Text>
                <TextInput
                  style={styles.input}
                  value={buyerEmail}
                  onChangeText={setBuyerEmail}
                  placeholder="juan@ejemplo.com"
                  placeholderTextColor="#9ca3af"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <Text style={styles.helperText}>
                  Se creará una cuenta automáticamente con este email
                </Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Teléfono</Text>
                <TextInput
                  style={styles.input}
                  value={buyerPhone}
                  onChangeText={setBuyerPhone}
                  placeholder="+52 123 456 7890"
                  placeholderTextColor="#9ca3af"
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {ticket.formFields && ticket.formFields.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Información Adicional</Text>

                {ticket.formFields.map((field: any) => (
                  <View key={field.id} style={styles.inputGroup}>
                    <Text style={styles.label}>
                      {field.label} {field.required && '*'}
                    </Text>
                    <TextInput
                      style={styles.input}
                      value={formData[field.id] || ''}
                      onChangeText={(value) => handleFormFieldChange(field.id, value)}
                      placeholder={`Ingresa ${field.label.toLowerCase()}`}
                      placeholderTextColor="#9ca3af"
                      keyboardType={
                        field.type === 'email'
                          ? 'email-address'
                          : field.type === 'phone'
                          ? 'phone-pad'
                          : 'default'
                      }
                    />
                  </View>
                ))}
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Método de Pago</Text>

              <TouchableOpacity
                style={[
                  styles.paymentOption,
                  paymentMethod === 'stripe' && styles.paymentOptionSelected,
                ]}
                onPress={() => setPaymentMethod('stripe')}
              >
                <View style={styles.radioCircle}>
                  {paymentMethod === 'stripe' && (
                    <View style={[styles.radioDot, { backgroundColor: primaryColor }]} />
                  )}
                </View>
                <View style={styles.paymentOptionContent}>
                  <View style={styles.paymentOptionHeader}>
                    <CreditCard color={primaryColor} size={24} />
                    <Text style={styles.paymentOptionTitle}>Tarjeta de Crédito/Débito</Text>
                  </View>
                  <Text style={styles.paymentOptionSubtitle}>
                    Pago seguro procesado por Stripe
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.paymentOption,
                  paymentMethod === 'transfer' && styles.paymentOptionSelected,
                ]}
                onPress={() => setPaymentMethod('transfer')}
              >
                <View style={styles.radioCircle}>
                  {paymentMethod === 'transfer' && (
                    <View style={[styles.radioDot, { backgroundColor: primaryColor }]} />
                  )}
                </View>
                <View style={styles.paymentOptionContent}>
                  <View style={styles.paymentOptionHeader}>
                    <FileText color={primaryColor} size={24} />
                    <Text style={styles.paymentOptionTitle}>Transferencia Bancaria</Text>
                  </View>
                  <Text style={styles.paymentOptionSubtitle}>
                    Confirma tu pago enviando el comprobante
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.totalSection}>
              <Text style={styles.totalLabel}>Total a Pagar:</Text>
              <Text style={[styles.totalValue, { color: primaryColor }]}>
                ${totalAmount.toFixed(2)} {ticket.currency}
              </Text>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.back()}
            disabled={isProcessing}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.purchaseButton,
              { backgroundColor: isProcessing ? '#9ca3af' : primaryColor },
            ]}
            onPress={handlePurchase}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <Loader color="#fff" size={20} />
            ) : (
              <Text style={styles.purchaseButtonText}>
                {paymentMethod === 'stripe' ? 'Pagar Ahora' : 'Confirmar Pedido'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  form: {
    padding: 20,
    gap: 24,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#6b7280',
  },
  ticketSummary: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  ticketName: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: '#111827',
  },
  ticketDescription: {
    fontSize: 15,
    color: '#6b7280',
    lineHeight: 22,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  priceLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#6b7280',
  },
  priceValue: {
    fontSize: 24,
    fontWeight: '700' as const,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#111827',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111827',
  },
  helperText: {
    fontSize: 14,
    color: '#6b7280',
  },
  section: {
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#111827',
    marginBottom: 4,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
  },
  paymentOptionSelected: {
    borderColor: '#6366f1',
    backgroundColor: '#eff6ff',
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  paymentOptionContent: {
    flex: 1,
    gap: 8,
  },
  paymentOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  paymentOptionTitle: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: '#111827',
  },
  paymentOptionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  totalSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#6b7280',
  },
  totalValue: {
    fontSize: 32,
    fontWeight: '700' as const,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#374151',
  },
  purchaseButton: {
    flex: 2,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  purchaseButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
});

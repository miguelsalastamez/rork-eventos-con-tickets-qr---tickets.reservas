import React, { useState } from 'react';
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
import { Plus, Trash2, Lock, Calendar, X } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTickets } from '@/contexts/TicketContext';
import { useEvents } from '@/contexts/EventContext';
import { useUser } from '@/contexts/UserContext';
import { Ticket, CapacityType, FormField, FormFieldType } from '@/types';
import ImagePicker from '@/components/ImagePicker';

const isWeb = Platform.OS === 'web';

export default function CreateTicketScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { addTicket, getEventCapacityPools, addCapacityPool } = useTickets();
  const { getEventById } = useEvents();
  const { canAccessFeature } = useUser();

  const event = getEventById(id);
  const capacityPools = getEventCapacityPools(id);
  const hasTicketsAccess = canAccessFeature('hasEmailSupport');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('MXN');
  const [saleStartDate, setSaleStartDate] = useState('');
  const [saleEndDate, setSaleEndDate] = useState('');
  const [capacityType, setCapacityType] = useState<CapacityType>('dedicated');
  const [sharedCapacityPoolId, setSharedCapacityPoolId] = useState('');
  const [sharedCapacityLimit, setSharedCapacityLimit] = useState('');
  const [dedicatedCapacity, setDedicatedCapacity] = useState('');
  const [salesLimit, setSalesLimit] = useState('');
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [newPoolName, setNewPoolName] = useState('');
  const [newPoolCapacity, setNewPoolCapacity] = useState('');

  const primaryColor = event?.primaryColor || '#6366f1';

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

  const handleAddFormField = () => {
    const newField: FormField = {
      id: `field-${Date.now()}`,
      label: '',
      type: 'text',
      required: false,
    };
    setFormFields([...formFields, newField]);
  };

  const handleUpdateFormField = (index: number, updates: Partial<FormField>) => {
    const updated = formFields.map((field, i) =>
      i === index ? { ...field, ...updates } : field
    );
    setFormFields(updated);
  };

  const handleRemoveFormField = (index: number) => {
    setFormFields(formFields.filter((_, i) => i !== index));
  };

  const handleCreatePool = async () => {
    if (!newPoolName.trim() || !newPoolCapacity) {
      Alert.alert('Error', 'Por favor completa el nombre y capacidad del pool');
      return;
    }

    const pool = {
      id: `pool-${Date.now()}`,
      eventId: id,
      name: newPoolName.trim(),
      totalCapacity: parseInt(newPoolCapacity, 10),
      usedCapacity: 0,
      createdAt: new Date().toISOString(),
    };

    await addCapacityPool(pool);
    setSharedCapacityPoolId(pool.id);
    setNewPoolName('');
    setNewPoolCapacity('');
    Alert.alert('Éxito', 'Pool de capacidad creado');
  };

  const handleCreate = async () => {
    if (!name.trim() || !price || !saleStartDate || !saleEndDate) {
      Alert.alert('Error', 'Por favor completa todos los campos obligatorios');
      return;
    }

    if (capacityType === 'dedicated' && !dedicatedCapacity) {
      Alert.alert('Error', 'Por favor especifica la capacidad dedicada');
      return;
    }

    if (capacityType === 'shared' && !sharedCapacityPoolId) {
      Alert.alert('Error', 'Por favor selecciona o crea un pool de capacidad compartida');
      return;
    }

    const ticket: Ticket = {
      id: `ticket-${Date.now()}`,
      eventId: id,
      name: name.trim(),
      description: description.trim(),
      imageUrl: imageUrl.trim() || undefined,
      price: parseFloat(price),
      currency,
      saleStartDate,
      saleEndDate,
      capacityType,
      sharedCapacityPoolId: capacityType === 'shared' ? sharedCapacityPoolId : undefined,
      sharedCapacityLimit: capacityType === 'shared' && sharedCapacityLimit ? parseInt(sharedCapacityLimit, 10) : undefined,
      dedicatedCapacity: capacityType === 'dedicated' && dedicatedCapacity ? parseInt(dedicatedCapacity, 10) : undefined,
      salesLimit: salesLimit ? parseInt(salesLimit, 10) : undefined,
      soldCount: 0,
      formFields: formFields.filter((f) => f.label.trim()),
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await addTicket(ticket);
    Alert.alert('Éxito', 'Ticket creado correctamente', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nombre del Ticket *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Ej: Entrada General"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Descripción *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Describe el tipo de entrada..."
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <ImagePicker
              label="Imagen del Ticket"
              helperText="Imagen del plano de ubicación de los asientos o sección"
              value={imageUrl}
              onChange={setImageUrl}
              aspectRatio={[16, 9]}
              maxWidth={1920}
              maxHeight={1080}
            />

            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.flex1]}>
                <Text style={styles.label}>Precio *</Text>
                <TextInput
                  style={styles.input}
                  value={price}
                  onChangeText={setPrice}
                  placeholder="0.00"
                  placeholderTextColor="#9ca3af"
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={[styles.inputGroup, { width: 100 }]}>
                <Text style={styles.label}>Moneda</Text>
                <TextInput
                  style={styles.input}
                  value={currency}
                  onChangeText={setCurrency}
                  placeholder="MXN"
                  placeholderTextColor="#9ca3af"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Fecha de Inicio de Venta *</Text>
              {isWeb ? (
                <View style={styles.dateInputContainer}>
                  <input
                    type="datetime-local"
                    value={saleStartDate ? new Date(saleStartDate).toISOString().slice(0, 16) : ''}
                    onChange={(e) => setSaleStartDate(e.target.value ? new Date(e.target.value).toISOString() : '')}
                    style={{
                      ...styles.input,
                      fontSize: 16,
                      fontFamily: 'system-ui, -apple-system, sans-serif',
                      flex: 1,
                    } as any}
                  />
                  {saleStartDate && (
                    <TouchableOpacity
                      style={styles.clearButton}
                      onPress={() => setSaleStartDate('')}
                    >
                      <X color="#ef4444" size={20} />
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <>
                  <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => setShowStartDatePicker(true)}
                  >
                    <Calendar color="#6366f1" size={20} />
                    <Text style={styles.dateButtonText}>
                      {saleStartDate ? new Date(saleStartDate).toLocaleString('es-MX', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      }) : 'Seleccionar fecha y hora'}
                    </Text>
                  </TouchableOpacity>
                  {showStartDatePicker && (
                    <DateTimePicker
                      value={startDate}
                      mode="date"
                      display="default"
                      onChange={(event, selectedDate) => {
                        setShowStartDatePicker(false);
                        if (event.type === 'set' && selectedDate) {
                          setStartDate(selectedDate);
                          setShowStartTimePicker(true);
                        }
                      }}
                    />
                  )}
                  {showStartTimePicker && (
                    <DateTimePicker
                      value={startDate}
                      mode="time"
                      display="default"
                      onChange={(event, selectedDate) => {
                        setShowStartTimePicker(false);
                        if (event.type === 'set' && selectedDate) {
                          setStartDate(selectedDate);
                          setSaleStartDate(selectedDate.toISOString());
                        }
                      }}
                    />
                  )}
                </>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Fecha de Fin de Venta *</Text>
              {isWeb ? (
                <View style={styles.dateInputContainer}>
                  <input
                    type="datetime-local"
                    value={saleEndDate ? new Date(saleEndDate).toISOString().slice(0, 16) : ''}
                    onChange={(e) => setSaleEndDate(e.target.value ? new Date(e.target.value).toISOString() : '')}
                    style={{
                      ...styles.input,
                      fontSize: 16,
                      fontFamily: 'system-ui, -apple-system, sans-serif',
                      flex: 1,
                    } as any}
                  />
                  {saleEndDate && (
                    <TouchableOpacity
                      style={styles.clearButton}
                      onPress={() => setSaleEndDate('')}
                    >
                      <X color="#ef4444" size={20} />
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <>
                  <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => setShowEndDatePicker(true)}
                  >
                    <Calendar color="#6366f1" size={20} />
                    <Text style={styles.dateButtonText}>
                      {saleEndDate ? new Date(saleEndDate).toLocaleString('es-MX', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      }) : 'Seleccionar fecha y hora'}
                    </Text>
                  </TouchableOpacity>
                  {showEndDatePicker && (
                    <DateTimePicker
                      value={endDate}
                      mode="date"
                      display="default"
                      onChange={(event, selectedDate) => {
                        setShowEndDatePicker(false);
                        if (event.type === 'set' && selectedDate) {
                          setEndDate(selectedDate);
                          setShowEndTimePicker(true);
                        }
                      }}
                    />
                  )}
                  {showEndTimePicker && (
                    <DateTimePicker
                      value={endDate}
                      mode="time"
                      display="default"
                      onChange={(event, selectedDate) => {
                        setShowEndTimePicker(false);
                        if (event.type === 'set' && selectedDate) {
                          setEndDate(selectedDate);
                          setSaleEndDate(selectedDate.toISOString());
                        }
                      }}
                    />
                  )}
                </>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Gestión de Capacidad</Text>
              
              <View style={styles.radioGroup}>
                <TouchableOpacity
                  style={styles.radioOption}
                  onPress={() => setCapacityType('shared')}
                >
                  <View style={[styles.radio, capacityType === 'shared' && styles.radioSelected]}>
                    {capacityType === 'shared' && <View style={styles.radioDot} />}
                  </View>
                  <View style={styles.radioLabel}>
                    <Text style={styles.radioLabelText}>Capacidad Compartida</Text>
                    <Text style={styles.radioLabelSubtext}>
                      Comparte capacidad con otros tickets
                    </Text>
                  </View>
                </TouchableOpacity>

                {capacityType === 'shared' && (
                  <View style={styles.subSection}>
                    {capacityPools.length > 0 && (
                      <View style={styles.inputGroup}>
                        <Text style={styles.label}>Seleccionar Pool Existente</Text>
                        <View style={styles.poolSelector}>
                          {capacityPools.map((pool) => (
                            <TouchableOpacity
                              key={pool.id}
                              style={[
                                styles.poolOption,
                                sharedCapacityPoolId === pool.id && styles.poolOptionSelected,
                              ]}
                              onPress={() => setSharedCapacityPoolId(pool.id)}
                            >
                              <Text style={styles.poolOptionText}>{pool.name}</Text>
                              <Text style={styles.poolOptionCapacity}>
                                {pool.usedCapacity} / {pool.totalCapacity}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    )}

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>O Crear Nuevo Pool</Text>
                      <TextInput
                        style={styles.input}
                        value={newPoolName}
                        onChangeText={setNewPoolName}
                        placeholder="Nombre del pool (ej: Platea General)"
                        placeholderTextColor="#9ca3af"
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Capacidad Total del Pool</Text>
                      <TextInput
                        style={styles.input}
                        value={newPoolCapacity}
                        onChangeText={setNewPoolCapacity}
                        placeholder="500"
                        placeholderTextColor="#9ca3af"
                        keyboardType="number-pad"
                      />
                    </View>

                    {newPoolName && newPoolCapacity && (
                      <TouchableOpacity
                        style={[styles.button, { backgroundColor: primaryColor }]}
                        onPress={handleCreatePool}
                      >
                        <Text style={styles.buttonText}>Crear Pool</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                <TouchableOpacity
                  style={styles.radioOption}
                  onPress={() => setCapacityType('dedicated')}
                >
                  <View style={[styles.radio, capacityType === 'dedicated' && styles.radioSelected]}>
                    {capacityType === 'dedicated' && <View style={styles.radioDot} />}
                  </View>
                  <View style={styles.radioLabel}>
                    <Text style={styles.radioLabelText}>Capacidad Dedicada</Text>
                    <Text style={styles.radioLabelSubtext}>
                      Capacidad exclusiva para este ticket
                    </Text>
                  </View>
                </TouchableOpacity>

                {capacityType === 'dedicated' && (
                  <View style={styles.subSection}>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Capacidad del Ticket</Text>
                      <TextInput
                        style={styles.input}
                        value={dedicatedCapacity}
                        onChangeText={setDedicatedCapacity}
                        placeholder="100"
                        placeholderTextColor="#9ca3af"
                        keyboardType="number-pad"
                      />
                    </View>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.radioOption}
                  onPress={() => setCapacityType('unlimited')}
                >
                  <View style={[styles.radio, capacityType === 'unlimited' && styles.radioSelected]}>
                    {capacityType === 'unlimited' && <View style={styles.radioDot} />}
                  </View>
                  <View style={styles.radioLabel}>
                    <Text style={styles.radioLabelText}>Capacidad Ilimitada</Text>
                    <Text style={styles.radioLabelSubtext}>
                      Sin límite de ventas
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Formulario de Información del Asistente</Text>
              <Text style={styles.helperText}>
                Campos personalizados para recopilar información de los compradores
              </Text>

              {formFields.map((field, index) => (
                <View key={field.id} style={styles.fieldCard}>
                  <View style={styles.fieldHeader}>
                    <Text style={styles.fieldLabel}>Campo #{index + 1}</Text>
                    <TouchableOpacity onPress={() => handleRemoveFormField(index)}>
                      <Trash2 color="#ef4444" size={20} />
                    </TouchableOpacity>
                  </View>

                  <TextInput
                    style={styles.input}
                    value={field.label}
                    onChangeText={(value) => handleUpdateFormField(index, { label: value })}
                    placeholder="Etiqueta del campo"
                    placeholderTextColor="#9ca3af"
                  />

                  <View style={styles.row}>
                    <TouchableOpacity
                      style={[
                        styles.checkboxContainer,
                        field.required && styles.checkboxContainerChecked,
                      ]}
                      onPress={() => handleUpdateFormField(index, { required: !field.required })}
                    >
                      <Text style={styles.checkboxText}>Requerido</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              <TouchableOpacity
                style={[styles.button, styles.buttonOutline]}
                onPress={handleAddFormField}
              >
                <Plus color={primaryColor} size={20} />
                <Text style={[styles.buttonText, { color: primaryColor }]}>
                  Añadir Campo
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.createButton, { backgroundColor: primaryColor }]}
            onPress={handleCreate}
          >
            <Text style={styles.createButtonText}>Crear Ticket</Text>
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
  textArea: {
    minHeight: 80,
    paddingTop: 14,
  },
  dateButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#111827',
    flex: 1,
  },
  dateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  clearButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 10,
  },
  helperText: {
    fontSize: 14,
    color: '#6b7280',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  flex1: {
    flex: 1,
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
  },
  radioGroup: {
    gap: 12,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  radioSelected: {
    borderColor: '#6366f1',
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#6366f1',
  },
  radioLabel: {
    flex: 1,
    gap: 4,
  },
  radioLabelText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#111827',
  },
  radioLabelSubtext: {
    fontSize: 14,
    color: '#6b7280',
  },
  subSection: {
    paddingLeft: 36,
    gap: 12,
  },
  poolSelector: {
    gap: 8,
  },
  poolOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
  },
  poolOptionSelected: {
    borderColor: '#6366f1',
    backgroundColor: '#eff6ff',
  },
  poolOptionText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#111827',
  },
  poolOptionCapacity: {
    fontSize: 14,
    color: '#6b7280',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  buttonOutline: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#6366f1',
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#fff',
  },
  fieldCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  fieldHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#111827',
  },
  checkboxContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  checkboxContainerChecked: {
    borderColor: '#6366f1',
    backgroundColor: '#eff6ff',
  },
  checkboxText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#111827',
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
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#374151',
  },
  createButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
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
});

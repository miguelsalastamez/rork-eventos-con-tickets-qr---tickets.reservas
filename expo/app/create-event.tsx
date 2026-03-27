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
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar, Clock, MapPin, IdCard, Volume2, Vibrate } from 'lucide-react-native';
import { useEvents } from '@/contexts/EventContext';
import { SUCCESS_SOUNDS, ERROR_SOUNDS } from '@/contexts/SettingsContext';
import { useUser } from '@/contexts/UserContext';
import ImagePicker from '@/components/ImagePicker';

const isWeb = Platform.OS === 'web';

export default function CreateEventScreen() {
  const router = useRouter();
  const { addEvent } = useEvents();
  const { user } = useUser();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState('18:00');
  const [venueName, setVenueName] = useState('');
  const [location, setLocation] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [organizerLogoUrl, setOrganizerLogoUrl] = useState('');
  const [venuePlanUrl, setVenuePlanUrl] = useState('');
  const [employeeNumberLabel, setEmployeeNumberLabel] = useState('');
  const [successSoundId, setSuccessSoundId] = useState('success-1');
  const [errorSoundId, setErrorSoundId] = useState('error-1');
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [vibrationIntensity, setVibrationIntensity] = useState<'light' | 'medium' | 'heavy'>('heavy');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleCreate = async () => {
    console.log('🔵 Creating event...');
    console.log('📝 Name:', name);
    console.log('📅 Date:', date.toISOString());
    console.log('⏰ Time:', time);
    console.log('📍 Location:', location);
    
    if (!name.trim()) {
      if (isWeb) {
        window.alert('El nombre del evento es requerido');
      } else {
        Alert.alert('Error', 'El nombre del evento es requerido');
      }
      return;
    }
    if (!venueName.trim()) {
      if (isWeb) {
        window.alert('El nombre del salón es requerido');
      } else {
        Alert.alert('Error', 'El nombre del salón es requerido');
      }
      return;
    }
    if (!location.trim()) {
      if (isWeb) {
        window.alert('La dirección es requerida');
      } else {
        Alert.alert('Error', 'La dirección es requerida');
      }
      return;
    }

    const event = {
      name: name.trim(),
      description: description.trim(),
      date: date.toISOString(),
      time,
      venueName: venueName.trim(),
      location: location.trim(),
      imageUrl: imageUrl.trim() || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800',
      organizerLogoUrl: organizerLogoUrl.trim() || undefined,
      venuePlanUrl: venuePlanUrl.trim() || undefined,
      employeeNumberLabel: employeeNumberLabel.trim() || undefined,
      successSoundId,
      errorSoundId,
      vibrationEnabled,
      vibrationIntensity,
      createdBy: user?.id || 'demo-user',
    };

    console.log('📦 Event object:', event);
    
    try {
      await addEvent(event);
      console.log('✅ Event created successfully');
      
      if (isWeb) {
        window.alert('Evento creado correctamente');
        router.back();
      } else {
        Alert.alert('Éxito', 'Evento creado correctamente', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'No se pudo crear el evento';
      console.error('❌ Error creating event:', errorMessage);
      if (isWeb) {
        window.alert(errorMessage);
      } else {
        Alert.alert('Error', errorMessage);
      }
    }
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
              <Text style={styles.label}>Nombre del Evento *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Ej: Conferencia Anual 2025"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Descripción</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Describe tu evento..."
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Fecha *</Text>
              {isWeb ? (
                <View style={styles.dateInputContainer}>
                  <Calendar color="#6366f1" size={20} />
                  <TextInput
                    style={styles.iconInput}
                    value={date.toISOString().split('T')[0]}
                    onChangeText={(text) => {
                      const newDate = new Date(text + 'T12:00:00');
                      if (!isNaN(newDate.getTime())) {
                        setDate(newDate);
                      }
                    }}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#9ca3af"
                  />
                </View>
              ) : (
                <>
                  <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Calendar color="#6366f1" size={20} />
                    <Text style={styles.dateButtonText}>
                      {date.toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </Text>
                  </TouchableOpacity>
                  {showDatePicker && (
                    <DateTimePicker
                      value={date}
                      mode="date"
                      display="default"
                      onChange={(event, selectedDate) => {
                        setShowDatePicker(false);
                        if (selectedDate) {
                          setDate(selectedDate);
                        }
                      }}
                      minimumDate={new Date()}
                    />
                  )}
                </>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Hora *</Text>
              <View style={styles.timeInputContainer}>
                <Clock color="#6366f1" size={20} />
                <TextInput
                  style={styles.timeInput}
                  value={time}
                  onChangeText={setTime}
                  placeholder="18:00"
                  placeholderTextColor="#9ca3af"
                  keyboardType="numbers-and-punctuation"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nombre del Salón/Sede *</Text>
              <View style={styles.iconInputContainer}>
                <MapPin color="#6366f1" size={20} />
                <TextInput
                  style={styles.iconInput}
                  value={venueName}
                  onChangeText={setVenueName}
                  placeholder="Ej: Centro de Convenciones"
                  placeholderTextColor="#9ca3af"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Dirección Completa *</Text>
              <View style={styles.iconInputContainer}>
                <MapPin color="#6366f1" size={20} />
                <TextInput
                  style={styles.iconInput}
                  value={location}
                  onChangeText={setLocation}
                  placeholder="Ej: Av. Principal 123, Ciudad"
                  placeholderTextColor="#9ca3af"
                />
              </View>
            </View>

            <ImagePicker
              label="Imagen o Video del Evento"
              helperText="Sube una imagen para el evento. Se optimizará automáticamente para mejor rendimiento."
              value={imageUrl}
              onChange={setImageUrl}
              aspectRatio={[16, 9]}
              quality={0.8}
              maxWidth={1920}
              maxHeight={1080}
            />

            <ImagePicker
              label="Logo de la Empresa Organizadora"
              helperText="Este logo aparecerá en tickets, códigos QR y reportes"
              value={organizerLogoUrl}
              onChange={setOrganizerLogoUrl}
              aspectRatio={[1, 1]}
              quality={0.9}
              maxWidth={512}
              maxHeight={512}
            />

            <ImagePicker
              label="Plano del Evento"
              helperText="Sube una imagen del plano del salón o venue del evento"
              value={venuePlanUrl}
              onChange={setVenuePlanUrl}
              aspectRatio={[4, 3]}
              quality={0.85}
              maxWidth={1920}
              maxHeight={1440}
            />

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nombre del Campo de Identificación</Text>
              <View style={styles.iconInputContainer}>
                <IdCard color="#6366f1" size={20} />
                <TextInput
                  style={styles.iconInput}
                  value={employeeNumberLabel}
                  onChangeText={setEmployeeNumberLabel}
                  placeholder="Ej: Número de Empleado, Número M, ID"
                  placeholderTextColor="#9ca3af"
                />
              </View>
              <Text style={styles.helperText}>
                Personaliza el nombre del campo según tu organización (por defecto: &quot;Número de Empleado&quot;)
              </Text>
            </View>

            <View style={styles.sectionDivider}>
              <Text style={styles.sectionTitle}>Configuración de Validación de Acceso</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Sonido de Éxito</Text>
              <View style={styles.soundSelector}>
                {SUCCESS_SOUNDS.map((sound) => (
                  <TouchableOpacity
                    key={sound.id}
                    style={[
                      styles.soundOption,
                      successSoundId === sound.id && styles.soundOptionSelected,
                    ]}
                    onPress={() => setSuccessSoundId(sound.id)}
                  >
                    <Volume2 
                      color={successSoundId === sound.id ? '#10b981' : '#6b7280'} 
                      size={20} 
                    />
                    <Text style={[
                      styles.soundOptionText,
                      successSoundId === sound.id && styles.soundOptionTextSelected,
                    ]}>
                      {sound.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Sonido de Error</Text>
              <View style={styles.soundSelector}>
                {ERROR_SOUNDS.map((sound) => (
                  <TouchableOpacity
                    key={sound.id}
                    style={[
                      styles.soundOption,
                      errorSoundId === sound.id && styles.soundOptionSelected,
                    ]}
                    onPress={() => setErrorSoundId(sound.id)}
                  >
                    <Volume2 
                      color={errorSoundId === sound.id ? '#ef4444' : '#6b7280'} 
                      size={20} 
                    />
                    <Text style={[
                      styles.soundOptionText,
                      errorSoundId === sound.id && styles.soundOptionTextSelected,
                    ]}>
                      {sound.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.switchRow}>
                <View style={styles.switchLabel}>
                  <Vibrate color="#6366f1" size={20} />
                  <Text style={styles.label}>Vibración Habilitada</Text>
                </View>
                <TouchableOpacity
                  style={[styles.switch, vibrationEnabled && styles.switchActive]}
                  onPress={() => setVibrationEnabled(!vibrationEnabled)}
                >
                  <View style={[styles.switchThumb, vibrationEnabled && styles.switchThumbActive]} />
                </TouchableOpacity>
              </View>
              <Text style={styles.helperText}>
                La vibración se activa cuando un código es válido
              </Text>
            </View>

            {vibrationEnabled && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Intensidad de Vibración</Text>
                <View style={styles.intensitySelector}>
                  <TouchableOpacity
                    style={[
                      styles.intensityOption,
                      vibrationIntensity === 'light' && styles.intensityOptionSelected,
                    ]}
                    onPress={() => setVibrationIntensity('light')}
                  >
                    <Text style={[
                      styles.intensityText,
                      vibrationIntensity === 'light' && styles.intensityTextSelected,
                    ]}>
                      Suave
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.intensityOption,
                      vibrationIntensity === 'medium' && styles.intensityOptionSelected,
                    ]}
                    onPress={() => setVibrationIntensity('medium')}
                  >
                    <Text style={[
                      styles.intensityText,
                      vibrationIntensity === 'medium' && styles.intensityTextSelected,
                    ]}>
                      Media
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.intensityOption,
                      vibrationIntensity === 'heavy' && styles.intensityOptionSelected,
                    ]}
                    onPress={() => setVibrationIntensity('heavy')}
                  >
                    <Text style={[
                      styles.intensityText,
                      vibrationIntensity === 'heavy' && styles.intensityTextSelected,
                    ]}>
                      Intensa
                    </Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.helperText}>
                  Una vibración más intensa ayuda a confirmar claramente el acceso válido
                </Text>
              </View>
            )}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.createButton} onPress={handleCreate}>
            <Text style={styles.createButtonText}>Crear Evento</Text>
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
    minHeight: 100,
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
  dateInputContainer: {
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
  },
  timeInputContainer: {
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
  timeInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    padding: 0,
  },
  iconInputContainer: {
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
  iconInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    padding: 0,
  },
  helperText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
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
    backgroundColor: '#6366f1',
    alignItems: 'center',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  sectionDivider: {
    marginTop: 8,
    marginBottom: 8,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#111827',
  },
  soundSelector: {
    gap: 8,
  },
  soundOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  soundOptionSelected: {
    borderColor: '#10b981',
    backgroundColor: '#f0fdf4',
  },
  soundOptionText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500' as const,
  },
  soundOptionTextSelected: {
    color: '#047857',
    fontWeight: '600' as const,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  switchLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  switch: {
    width: 56,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e5e7eb',
    padding: 2,
    justifyContent: 'center',
  },
  switchActive: {
    backgroundColor: '#6366f1',
  },
  switchThumb: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff',
  },
  switchThumbActive: {
    alignSelf: 'flex-end',
  },
  intensitySelector: {
    flexDirection: 'row',
    gap: 8,
  },
  intensityOption: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  intensityOptionSelected: {
    borderColor: '#6366f1',
    backgroundColor: '#eff6ff',
  },
  intensityText: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: '#6b7280',
  },
  intensityTextSelected: {
    color: '#4f46e5',
    fontWeight: '600' as const,
  },
});

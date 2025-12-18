import React, { useState, useEffect } from 'react';
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
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Palette, Volume2, Vibrate, IdCard, Save, Ticket as TicketIcon, Lock, AlertTriangle } from 'lucide-react-native';
import ColorPicker from '@/components/ColorPicker';
import { useEvents } from '@/contexts/EventContext';
import { useUser } from '@/contexts/UserContext';
import { canManageEventSettings } from '@/lib/permissions';
import { SUCCESS_SOUNDS, ERROR_SOUNDS } from '@/contexts/SettingsContext';
import { Audio, AVPlaybackStatus } from 'expo-av';
import * as Haptics from 'expo-haptics';

const DEFAULT_COLORS = {
  primary: '#6366f1',
  secondary: '#8b5cf6',
  background: '#f9fafb',
  text: '#111827',
};

const COLOR_PRESETS = [
  { name: 'Azul Corporativo', primary: '#6366f1', secondary: '#8b5cf6', background: '#f9fafb', text: '#111827' },
  { name: 'Verde Empresarial', primary: '#10b981', secondary: '#059669', background: '#f0fdf4', text: '#064e3b' },
  { name: 'Rojo Vibrante', primary: '#ef4444', secondary: '#dc2626', background: '#fef2f2', text: '#7f1d1d' },
  { name: 'Naranja Energético', primary: '#f97316', secondary: '#ea580c', background: '#fff7ed', text: '#7c2d12' },
  { name: 'Morado Elegante', primary: '#a855f7', secondary: '#9333ea', background: '#faf5ff', text: '#581c87' },
  { name: 'Azul Marino', primary: '#1e40af', secondary: '#1e3a8a', background: '#eff6ff', text: '#1e3a8a' },
];

export default function EventSettingsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { updateEvent, getEventById } = useEvents();
  const { user, subscriptionTier, canAccessFeature } = useUser();

  const event = getEventById(id);
  const userCanManageSettings = event ? canManageEventSettings(event, user) : false;

  const hasTicketsAccess = canAccessFeature('hasEmailSupport');

  const [employeeNumberLabel, setEmployeeNumberLabel] = useState('');
  const [successSoundId, setSuccessSoundId] = useState('success-1');
  const [errorSoundId, setErrorSoundId] = useState('error-1');
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [vibrationIntensity, setVibrationIntensity] = useState<'light' | 'medium' | 'heavy'>('heavy');
  
  const [primaryColor, setPrimaryColor] = useState(DEFAULT_COLORS.primary);
  const [secondaryColor, setSecondaryColor] = useState(DEFAULT_COLORS.secondary);
  const [backgroundColor, setBackgroundColor] = useState(DEFAULT_COLORS.background);
  const [textColor, setTextColor] = useState(DEFAULT_COLORS.text);
  
  const [colorPickerVisible, setColorPickerVisible] = useState(false);
  const [editingColor, setEditingColor] = useState<'primary' | 'secondary' | 'background' | 'text'>('primary');
  const [tempColor, setTempColor] = useState(primaryColor);

  useEffect(() => {
    if (event) {
      setEmployeeNumberLabel(event.employeeNumberLabel || '');
      setSuccessSoundId(event.successSoundId || 'success-1');
      setErrorSoundId(event.errorSoundId || 'error-1');
      setVibrationEnabled(event.vibrationEnabled !== false);
      setVibrationIntensity(event.vibrationIntensity || 'heavy');
      setPrimaryColor(event.primaryColor || DEFAULT_COLORS.primary);
      setSecondaryColor(event.secondaryColor || DEFAULT_COLORS.secondary);
      setBackgroundColor(event.backgroundColor || DEFAULT_COLORS.background);
      setTextColor(event.textColor || DEFAULT_COLORS.text);
    }

    if (Platform.OS !== 'web') {
      Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });
    }
  }, [event]);

  if (!event) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Evento no encontrado</Text>
      </View>
    );
  }

  if (!userCanManageSettings) {
    return (
      <>
        <Stack.Screen options={{ title: 'Configuración del Evento' }} />
        <View style={styles.errorContainer}>
          <AlertTriangle color="#ef4444" size={48} />
          <Text style={styles.errorTitle}>Acceso Denegado</Text>
          <Text style={styles.errorText}>
            No tienes permisos para modificar la configuración de este evento.
          </Text>
          <TouchableOpacity 
            style={styles.errorButton} 
            onPress={() => router.back()}
          >
            <Text style={styles.errorButtonText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  }

  const playPreviewSound = async (soundUrl: string) => {
    if (Platform.OS === 'web') {
      console.log('Sound preview not available on web');
      return;
    }
    
    try {
      console.log('Playing preview sound:', soundUrl);
      const { sound } = await Audio.Sound.createAsync(
        { uri: soundUrl },
        { shouldPlay: true, volume: 1.0 },
        null,
        false
      );
      await sound.setVolumeAsync(1.0);
      await sound.playAsync();
      console.log('Preview sound playing');
      
      sound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
        if (status.isLoaded && status.didJustFinish) {
          console.log('Preview sound finished');
          sound.unloadAsync();
        }
      });
    } catch (error) {
      console.log('Error playing preview sound:', error);
    }
  };

  const triggerPreviewVibration = async (intensity: 'light' | 'medium' | 'heavy') => {
    if (Platform.OS === 'web') {
      console.log('Vibration not available on web');
      return;
    }
    
    try {
      switch (intensity) {
        case 'light':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case 'medium':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          await new Promise(resolve => setTimeout(resolve, 100));
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'heavy':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          await new Promise(resolve => setTimeout(resolve, 80));
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          await new Promise(resolve => setTimeout(resolve, 80));
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
      }
    } catch (error) {
      console.log('Error triggering preview vibration:', error);
    }
  };

  const applyColorPreset = (preset: typeof COLOR_PRESETS[0]) => {
    setPrimaryColor(preset.primary);
    setSecondaryColor(preset.secondary);
    setBackgroundColor(preset.background);
    setTextColor(preset.text);
  };

  const openColorPicker = (colorType: 'primary' | 'secondary' | 'background' | 'text') => {
    setEditingColor(colorType);
    switch (colorType) {
      case 'primary':
        setTempColor(primaryColor);
        break;
      case 'secondary':
        setTempColor(secondaryColor);
        break;
      case 'background':
        setTempColor(backgroundColor);
        break;
      case 'text':
        setTempColor(textColor);
        break;
    }
    setColorPickerVisible(true);
  };

  const handleColorChange = (newColor: string) => {
    setTempColor(newColor);
    switch (editingColor) {
      case 'primary':
        setPrimaryColor(newColor);
        break;
      case 'secondary':
        setSecondaryColor(newColor);
        break;
      case 'background':
        setBackgroundColor(newColor);
        break;
      case 'text':
        setTextColor(newColor);
        break;
    }
  };

  const getColorPickerTitle = () => {
    switch (editingColor) {
      case 'primary':
        return 'Color Primario';
      case 'secondary':
        return 'Color Secundario';
      case 'background':
        return 'Color de Fondo';
      case 'text':
        return 'Color de Texto';
      default:
        return 'Seleccionar Color';
    }
  };

  const handleSave = async () => {
    const updates = {
      employeeNumberLabel: employeeNumberLabel.trim() || undefined,
      successSoundId,
      errorSoundId,
      vibrationEnabled,
      vibrationIntensity,
      primaryColor,
      secondaryColor,
      backgroundColor,
      textColor,
    };

    try {
      await updateEvent(id, updates);
      Alert.alert('Éxito', 'Configuración guardada correctamente', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('Error updating event settings:', error);
      Alert.alert('Error', 'No se pudo guardar la configuración');
    }
  };

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: 'Configuración del Evento',
          headerStyle: { backgroundColor: primaryColor },
          headerTintColor: '#fff',
        }} 
      />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.form}>
              
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Palette color={primaryColor} size={24} />
                  <Text style={styles.sectionTitle}>Personalización de Colores</Text>
                </View>
                <Text style={styles.sectionDescription}>
                  Adapta los colores del evento a tu imagen corporativa
                </Text>

                <View style={styles.presetsContainer}>
                  <Text style={styles.presetsLabel}>Paletas Predefinidas:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetsScroll}>
                    {COLOR_PRESETS.map((preset, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.presetCard}
                        onPress={() => applyColorPreset(preset)}
                      >
                        <View style={styles.presetColors}>
                          <View style={[styles.presetColorCircle, { backgroundColor: preset.primary }]} />
                          <View style={[styles.presetColorCircle, { backgroundColor: preset.secondary }]} />
                        </View>
                        <Text style={styles.presetName}>{preset.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                <View style={styles.colorInputGroup}>
                  <Text style={styles.label}>Color Primario</Text>
                  <TouchableOpacity 
                    style={styles.colorInputRow}
                    onPress={() => openColorPicker('primary')}
                  >
                    <View style={[styles.colorPreview, { backgroundColor: primaryColor }]} />
                    <View style={styles.colorInputTextContainer}>
                      <Text style={styles.colorInputText}>{primaryColor.toUpperCase()}</Text>
                      <Text style={styles.colorInputHint}>Toca para cambiar</Text>
                    </View>
                  </TouchableOpacity>
                </View>

                <View style={styles.colorInputGroup}>
                  <Text style={styles.label}>Color Secundario</Text>
                  <TouchableOpacity 
                    style={styles.colorInputRow}
                    onPress={() => openColorPicker('secondary')}
                  >
                    <View style={[styles.colorPreview, { backgroundColor: secondaryColor }]} />
                    <View style={styles.colorInputTextContainer}>
                      <Text style={styles.colorInputText}>{secondaryColor.toUpperCase()}</Text>
                      <Text style={styles.colorInputHint}>Toca para cambiar</Text>
                    </View>
                  </TouchableOpacity>
                </View>

                <View style={styles.colorInputGroup}>
                  <Text style={styles.label}>Color de Fondo</Text>
                  <TouchableOpacity 
                    style={styles.colorInputRow}
                    onPress={() => openColorPicker('background')}
                  >
                    <View style={[styles.colorPreview, { backgroundColor: backgroundColor }]} />
                    <View style={styles.colorInputTextContainer}>
                      <Text style={styles.colorInputText}>{backgroundColor.toUpperCase()}</Text>
                      <Text style={styles.colorInputHint}>Toca para cambiar</Text>
                    </View>
                  </TouchableOpacity>
                </View>

                <View style={styles.colorInputGroup}>
                  <Text style={styles.label}>Color de Texto</Text>
                  <TouchableOpacity 
                    style={styles.colorInputRow}
                    onPress={() => openColorPicker('text')}
                  >
                    <View style={[styles.colorPreview, { backgroundColor: textColor }]} />
                    <View style={styles.colorInputTextContainer}>
                      <Text style={styles.colorInputText}>{textColor.toUpperCase()}</Text>
                      <Text style={styles.colorInputHint}>Toca para cambiar</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <IdCard color={primaryColor} size={24} />
                  <Text style={styles.sectionTitle}>Campos Personalizables</Text>
                </View>
                <Text style={styles.sectionDescription}>
                  Define el nombre del campo de identificación según tu organización
                </Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Nombre del Campo de Identificación</Text>
                  <TextInput
                    style={styles.input}
                    value={employeeNumberLabel}
                    onChangeText={setEmployeeNumberLabel}
                    placeholder="Ej: Número de Empleado, Número M, ID"
                    placeholderTextColor="#9ca3af"
                  />
                  <Text style={styles.helperText}>
                    Este será el nombre mostrado para el campo de identificación en formularios y listados. Por defecto: &quot;Número de Empleado&quot;
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <TicketIcon color={primaryColor} size={24} />
                  <Text style={styles.sectionTitle}>Gestión de Tickets</Text>
                </View>
                <Text style={styles.sectionDescription}>
                  Configura entradas y precios de venta para tu evento
                </Text>

                {!hasTicketsAccess ? (
                  <View style={styles.lockedFeature}>
                    <View style={styles.lockedFeatureHeader}>
                      <Lock color="#9ca3af" size={32} />
                      <Text style={styles.lockedFeatureTitle}>Función Premium</Text>
                    </View>
                    <Text style={styles.lockedFeatureText}>
                      La gestión de tickets está disponible solo con suscripción PRO. Actualiza tu plan para acceder a esta funcionalidad.
                    </Text>
                    <TouchableOpacity
                      style={[styles.upgradeButton, { backgroundColor: primaryColor }]}
                      onPress={() => router.push('/subscription' as any)}
                    >
                      <Text style={styles.upgradeButtonText}>Actualizar a PRO</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.ticketsButton}
                    onPress={() => router.push(`/event/${id}/tickets` as any)}
                  >
                    <View style={[styles.ticketsButtonIcon, { backgroundColor: `${primaryColor}15` }]}>
                      <TicketIcon color={primaryColor} size={24} />
                    </View>
                    <View style={styles.ticketsButtonContent}>
                      <Text style={styles.ticketsButtonTitle}>Gestionar Tickets</Text>
                      <Text style={styles.ticketsButtonSubtitle}>
                        Configura tipos de entradas, precios y capacidad
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.divider} />

              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Volume2 color={primaryColor} size={24} />
                  <Text style={styles.sectionTitle}>Sonidos de Validación</Text>
                </View>
                <Text style={styles.sectionDescription}>
                  Elige los sonidos que se reproducirán al escanear códigos QR
                </Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Sonido de Éxito</Text>
                  <View style={styles.soundSelector}>
                    {SUCCESS_SOUNDS.map((sound) => (
                      <TouchableOpacity
                        key={sound.id}
                        style={[
                          styles.soundOption,
                          successSoundId === sound.id && [styles.soundOptionSelected, { borderColor: primaryColor }],
                        ]}
                        onPress={() => {
                          setSuccessSoundId(sound.id);
                          playPreviewSound(sound.url);
                        }}
                      >
                        <Volume2 
                          color={successSoundId === sound.id ? primaryColor : '#6b7280'} 
                          size={20} 
                        />
                        <Text style={[
                          styles.soundOptionText,
                          successSoundId === sound.id && [styles.soundOptionTextSelected, { color: primaryColor }],
                        ]}>
                          {sound.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <Text style={styles.helperText}>
                    Toca una opción para escuchar una vista previa
                  </Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Sonido de Error</Text>
                  <View style={styles.soundSelector}>
                    {ERROR_SOUNDS.map((sound) => (
                      <TouchableOpacity
                        key={sound.id}
                        style={[
                          styles.soundOption,
                          errorSoundId === sound.id && [styles.soundOptionSelected, { borderColor: '#ef4444' }],
                        ]}
                        onPress={() => {
                          setErrorSoundId(sound.id);
                          playPreviewSound(sound.url);
                        }}
                      >
                        <Volume2 
                          color={errorSoundId === sound.id ? '#ef4444' : '#6b7280'} 
                          size={20} 
                        />
                        <Text style={[
                          styles.soundOptionText,
                          errorSoundId === sound.id && [styles.soundOptionTextSelected, { color: '#ef4444' }],
                        ]}>
                          {sound.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <Text style={styles.helperText}>
                    Toca una opción para escuchar una vista previa
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Vibrate color={primaryColor} size={24} />
                  <Text style={styles.sectionTitle}>Retroalimentación Táctil</Text>
                </View>
                <Text style={styles.sectionDescription}>
                  Configura la vibración para confirmar accesos válidos
                </Text>

                <View style={styles.inputGroup}>
                  <View style={styles.switchRow}>
                    <View style={styles.switchLabel}>
                      <Vibrate color={primaryColor} size={20} />
                      <Text style={styles.label}>Vibración Habilitada</Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.switch, vibrationEnabled && [styles.switchActive, { backgroundColor: primaryColor }]]}
                      onPress={() => setVibrationEnabled(!vibrationEnabled)}
                    >
                      <View style={[styles.switchThumb, vibrationEnabled && styles.switchThumbActive]} />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.helperText}>
                    La vibración se activa cuando un código QR es válido
                  </Text>
                </View>

                {vibrationEnabled && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Intensidad de Vibración</Text>
                    <View style={styles.intensitySelector}>
                      <TouchableOpacity
                        style={[
                          styles.intensityOption,
                          vibrationIntensity === 'light' && [styles.intensityOptionSelected, { borderColor: primaryColor, backgroundColor: `${primaryColor}15` }],
                        ]}
                        onPress={() => {
                          setVibrationIntensity('light');
                          triggerPreviewVibration('light');
                        }}
                      >
                        <Text style={[
                          styles.intensityText,
                          vibrationIntensity === 'light' && [styles.intensityTextSelected, { color: primaryColor }],
                        ]}>
                          Suave
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.intensityOption,
                          vibrationIntensity === 'medium' && [styles.intensityOptionSelected, { borderColor: primaryColor, backgroundColor: `${primaryColor}15` }],
                        ]}
                        onPress={() => {
                          setVibrationIntensity('medium');
                          triggerPreviewVibration('medium');
                        }}
                      >
                        <Text style={[
                          styles.intensityText,
                          vibrationIntensity === 'medium' && [styles.intensityTextSelected, { color: primaryColor }],
                        ]}>
                          Media
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.intensityOption,
                          vibrationIntensity === 'heavy' && [styles.intensityOptionSelected, { borderColor: primaryColor, backgroundColor: `${primaryColor}15` }],
                        ]}
                        onPress={() => {
                          setVibrationIntensity('heavy');
                          triggerPreviewVibration('heavy');
                        }}
                      >
                        <Text style={[
                          styles.intensityText,
                          vibrationIntensity === 'heavy' && [styles.intensityTextSelected, { color: primaryColor }],
                        ]}>
                          Intensa
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.helperText}>
                      Una vibración más intensa ayuda a confirmar claramente el acceso válido. Toca para probar.
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.saveButton, { backgroundColor: primaryColor }]} onPress={handleSave}>
              <Save color="#fff" size={20} />
              <Text style={styles.saveButtonText}>Guardar Configuración</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
        
        <ColorPicker
          visible={colorPickerVisible}
          color={tempColor}
          onColorChange={handleColorChange}
          onClose={() => setColorPickerVisible(false)}
          title={getColorPickerTitle()}
        />
      </SafeAreaView>
    </>
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
    padding: 20,
    gap: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: '#111827',
    marginTop: 12,
  },
  errorText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center' as const,
  },
  errorButton: {
    marginTop: 20,
    paddingHorizontal: 32,
    paddingVertical: 14,
    backgroundColor: '#6366f1',
    borderRadius: 10,
  },
  errorButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  form: {
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#111827',
  },
  sectionDescription: {
    fontSize: 15,
    color: '#6b7280',
    marginBottom: 20,
    lineHeight: 22,
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 24,
  },
  presetsContainer: {
    marginBottom: 20,
  },
  presetsLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#111827',
    marginBottom: 12,
  },
  presetsScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  presetCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minWidth: 140,
  },
  presetColors: {
    flexDirection: 'row',
    gap: 8,
  },
  presetColorCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  presetName: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: '#111827',
    textAlign: 'center' as const,
  },
  colorInputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#111827',
    marginBottom: 8,
  },
  colorInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 12,
  },
  colorInputTextContainer: {
    flex: 1,
  },
  colorInputText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#111827',
    letterSpacing: 1,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
  },
  colorInputHint: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  colorPreview: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  colorInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
  },
  inputGroup: {
    marginBottom: 20,
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
    marginTop: 8,
    lineHeight: 20,
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
    backgroundColor: '#f0fdf4',
  },
  soundOptionText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500' as const,
  },
  soundOptionTextSelected: {
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
  switchActive: {},
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
  intensityOptionSelected: {},
  intensityText: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: '#6b7280',
  },
  intensityTextSelected: {
    fontWeight: '600' as const,
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
  saveButton: {
    flex: 2,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  ticketsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
  },
  ticketsButtonIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ticketsButtonContent: {
    flex: 1,
    gap: 4,
  },
  ticketsButtonTitle: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: '#111827',
  },
  ticketsButtonSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  lockedFeature: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  lockedFeatureHeader: {
    alignItems: 'center',
    gap: 12,
  },
  lockedFeatureTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#111827',
  },
  lockedFeatureText: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  upgradeButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 8,
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
});
